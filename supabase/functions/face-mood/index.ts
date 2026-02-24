import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, augmentPass } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageBase64) {
      throw new Error("No image provided");
    }

    const augmentNote = typeof augmentPass === 'number' && augmentPass > 0
      ? ` This is inference pass ${augmentPass + 1}. Apply slight variation in your analysis perspective to enable ensemble averaging.`
      : '';

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
            content: `You are an advanced facial emotion and health analysis expert. Analyze the face in the image with clinical precision. You MUST detect subtle expressions including neutral faces.

EMOTION DETECTION RULES:
- Detect one of: "happy", "sad", "angry", "anxious", "neutral", "tired", "stressed"
- For NEUTRAL faces: Look carefully at micro-expressions — slight lip tension, eye narrowing, brow position, skin pallor, under-eye darkness
- A "neutral" face is VALID. Do not force a strong emotion if the face is genuinely neutral
- Confidence should reflect how clear the expression is (neutral faces can have high confidence too)

UNDERLYING HEALTH INDICATORS (analyze even for neutral faces):
Look for visible signs of:
- Sleep deprivation: dark circles, puffy eyes, drooping eyelids
- Dehydration: dry/cracked lips, sunken eyes
- Stress/tension: jaw clenching, forehead lines, furrowed brow
- Fatigue: pale complexion, glazed eyes, slack facial muscles
- Skin health: acne (stress-related), redness, pallor

Return a JSON object with these fields:
- mood: one of the 7 emotions above
- confidence: number 0-100
- description: one sentence describing the emotional state AND any visible health signs
- wellness_tip: one actionable wellness suggestion based on BOTH the detected emotion AND any health indicators
- health_flags: array of strings listing any underlying health observations (e.g., ["dark_circles", "tension_lines", "dry_lips"])

Return ONLY valid JSON, no markdown, no explanation.${augmentNote}`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              },
              {
                type: "text",
                text: "Analyze this face for emotional state and any visible health indicators. Be thorough even if the expression appears neutral."
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
        health_flags: []
      };
    }

    // Ensure health_flags exists
    if (!result.health_flags) result.health_flags = [];

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
