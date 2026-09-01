import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { imageBase64, augmentPass, postureMode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!imageBase64) throw new Error("No image provided");

    const augmentNote = typeof augmentPass === 'number' && augmentPass > 0
      ? ` This is inference pass ${augmentPass + 1}. Apply slight variation in your analysis perspective to enable ensemble averaging.`
      : '';

    const postureAnalysisSection = postureMode ? `
POSTURE ANALYSIS (user is in posture mode — upper body visible):
Carefully analyse the neck, shoulders, and spine alignment:
- Head position: Is the head forward (forward head posture), tilted, or aligned with shoulders?
- Shoulder alignment: Are shoulders level or is one higher/lower? Are they rounded forward?
- Spine: Is there visible slouching or kyphosis (upper back rounding)?
- Chin-to-chest distance: Is the neck craning forward?

Populate posture_flags with any of these applicable strings:
["forward_head", "rounded_shoulders", "left_shoulder_elevated", "right_shoulder_elevated", 
 "upper_back_rounded", "neck_strain", "head_tilt_left", "head_tilt_right", "chin_forward",
 "asymmetric_posture", "good_alignment"]

Calculate posture_score (0-100): 
- 100 = perfect upright alignment
- 80-99 = minor adjustments needed
- 60-79 = moderate postural issues
- 40-59 = significant postural problems
- below 40 = severe postural strain` : `
POSTURE ANALYSIS: postureMode is off. Set posture_score to null and posture_flags to [].`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an advanced AI health and wellness analyst. Analyze facial expressions, visible health indicators, and (when posture mode is active) body alignment with clinical precision.

EMOTION DETECTION (always):
Detect one of: "happy", "sad", "angry", "anxious", "neutral", "tired", "stressed", "content", "fearful", "disgusted", "surprised", "grief"
- Distinguish "content" (calm satisfaction) from "happy" (active joy)
- Distinguish "fearful" (wide eyes, raised brows, open mouth) from "anxious" (furrowed brow, tight jaw, worried expression)
- A genuine "neutral" face is valid with high confidence
- Confidence: how clearly the expression is readable (0-100)

VISIBLE HEALTH INDICATORS (always — even for neutral faces):
Look carefully for:
- Sleep deprivation: dark under-eye circles, puffiness, drooping eyelids, glazed eyes
- Dehydration: dry or cracked lips, sunken eyes, dull skin tone
- Stress/tension: jaw clenching, temple tension, deep forehead furrows, tight mouth corners
- Fatigue: pale or ashen complexion, slack facial muscles, half-closed eyes
- Eye health: visible redness, conjunctival pallor, asymmetric eye opening (ptosis), swelling
- Skin signals: flushing (stress/fever), pallor (anaemia/anxiety), jaundice tint (yellowish hue), stress acne
- Emotional numbing: flat affect, reduced micro-expressions (relevant for depression/PTSD)

Populate health_flags with applicable strings from this list:
["dark_circles", "eye_puffiness", "dry_lips", "glazed_eyes", "tension_lines", "jaw_clenching",
 "pale_complexion", "flushed_skin", "red_eyes", "eye_asymmetry", "ptosis", "stress_acne",
 "sunken_eyes", "flat_affect", "jaundice_tint", "conjunctival_pallor", "eye_redness",
 "forehead_tension", "nasolabial_deepening", "lip_compression"]

${postureAnalysisSection}

Return a JSON object with these fields:
{
  "mood": string (one of the 12 emotions above),
  "confidence": number (0-100),
  "description": string (2 sentences: describe emotional state AND any notable health or posture signals),
  "wellness_tip": string (one specific actionable suggestion based on detected mood + health + posture flags combined),
  "health_flags": string[] (visible health indicators),
  "posture_score": number | null (0-100 or null if not in posture mode),
  "posture_flags": string[] (posture indicators or [] if not in posture mode),
  "posture_tip": string | null (specific posture correction exercise or null if not in posture mode)
}

Return ONLY valid JSON, no markdown, no explanation.${augmentNote}`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
              },
              {
                type: "text",
                text: postureMode
                  ? "Analyze this image for: (1) facial emotional state, (2) visible health indicators, and (3) body posture including neck, shoulder, and spine alignment. Be thorough."
                  : "Analyze this face for emotional state and any visible health indicators. Be thorough even if the expression appears neutral."
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      result = {
        mood: "neutral",
        confidence: 50,
        description: "Could not clearly analyze the expression",
        wellness_tip: "Try a quick breathing exercise to center yourself",
        health_flags: [],
        posture_score: null,
        posture_flags: [],
        posture_tip: null,
      };
    }

    // Ensure all fields exist
    if (!result.health_flags) result.health_flags = [];
    if (!result.posture_flags) result.posture_flags = [];
    if (result.posture_score === undefined) result.posture_score = null;
    if (result.posture_tip === undefined) result.posture_tip = null;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("face-mood error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
