import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { transcript, audioFeatures, userProfile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context from audio features
    const { avgVolume = 0, variance = 0, avgPitch = 0, duration = 0, pauseCount = 0, wordsPerMinute = 0 } = audioFeatures || {};

    const hasTranscript = transcript && transcript.trim().length > 10;

    if (!hasTranscript && (!audioFeatures || avgVolume < 5)) {
      return new Response(JSON.stringify({
        error: "Insufficient audio data. Please speak more clearly and for longer."
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const systemPrompt = `You are a clinical mental health screening assistant trained in evidence-based assessment tools (PHQ-9, GAD-7, Columbia Protocol). Analyze the provided voice recording data.

You will receive:
1. A text transcript of what was said (may be incomplete or empty)
2. Audio signal features extracted during the recording

Your task: Analyze BOTH content (what was said) AND delivery (how it was said) to assess emotional state.

CONTENT ANALYSIS (if transcript available):
- Identify emotional themes: sadness, fear, anger, hopelessness, loneliness, stress, joy, anxiety, numbness
- Detect cognitive distortions: catastrophizing, all-or-nothing thinking, personalization
- Flag concerning content: expressions of hopelessness, worthlessness, suicidal ideation, trauma references, substance mentions
- Detect positive signals: gratitude, accomplishment, connection, hope
- Speech coherence: fragmented vs fluent thoughts (fragmentation can indicate anxiety/dissociation)
- PHQ-2 quick screen: any mention of low mood most days OR loss of interest?

DELIVERY ANALYSIS (audio features):
- Volume level (${avgVolume.toFixed(1)}): Low = fatigue/depression, High = anxiety/anger
- Variance (${variance.toFixed(1)}): Low = flat affect (depression/numbness), High = emotional dysregulation
- Pitch activity (${avgPitch.toFixed(1)}): Low = monotone/depression, High = anxiety/excitement
- Duration (${duration}s): Very short = avoidance, longer = engagement
- Pause count (${pauseCount}): Many pauses = difficulty with words, cognitive load, distress
- Words per minute (${wordsPerMinute}): Very fast = anxiety/mania, very slow = depression/fatigue

MOOD CLASSIFICATION:
Choose from: "happy", "sad", "anxious", "angry", "neutral", "tired", "stressed", "grief", "numb", "hopeful", "overwhelmed"

MENTAL STATE INDICATORS (populate relevant ones):
["low_energy", "flat_affect", "cognitive_fragmentation", "hopelessness_markers", "anxiety_markers",
 "anger_markers", "social_withdrawal_indicators", "trauma_references", "substance_mentions",
 "sleep_issues_mentioned", "physical_pain_mentioned", "academic_stress", "relationship_stress",
 "work_stress", "financial_stress", "family_conflict", "grief_markers", "positive_coping",
 "seeking_help", "gratitude", "accomplishment", "connection", "phq2_positive",
 "suicidal_ideation_risk", "self_harm_risk"]

URGENCY LEVEL: "low" | "moderate" | "high" | "crisis"
- crisis: explicit suicide/self-harm mention or expression of having no reason to live
- high: hopelessness, feeling trapped, severe distress
- moderate: significant stress, anxiety, or depression markers
- low: mild stress or positive/neutral state

Return JSON:
{
  "mood": string,
  "confidence": number (0-100, based on how strong the evidence is),
  "description": string (2-3 sentences: describe emotional state based on both content and delivery),
  "wellness_tip": string (one specific, actionable tip tailored to detected state),
  "mental_state_indicators": string[] (from the list above),
  "suggested_action": string (one specific next step: "Try 4-7-8 breathing" or "Consider reaching out to a friend" or "Please call iCall: 9152987821"),
  "urgency": string ("low" | "moderate" | "high" | "crisis"),
  "transcript_themes": string[] (2-4 key themes identified in the speech content),
  "phq2_flag": boolean (true if PHQ-2 screen positive indicators present)
}

Return ONLY valid JSON.`;

    const userContent = hasTranscript
      ? `TRANSCRIPT:\n"${transcript}"\n\nAUDIO FEATURES:\n- Average volume: ${avgVolume.toFixed(1)}\n- Volume variance: ${variance.toFixed(1)}\n- Pitch activity: ${avgPitch.toFixed(1)}\n- Recording duration: ${duration}s\n- Pause count: ${pauseCount}\n- Words per minute: ${wordsPerMinute}\n${userProfile ? `\nUSER PROFILE:\n- Occupation: ${userProfile.occupation}\n- Age: ${userProfile.age}` : ''}`
      : `TRANSCRIPT: [Not available — audio only analysis]\n\nAUDIO FEATURES:\n- Average volume: ${avgVolume.toFixed(1)}\n- Volume variance: ${variance.toFixed(1)}\n- Pitch activity: ${avgPitch.toFixed(1)}\n- Recording duration: ${duration}s\n- Pause count: ${pauseCount}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      // Fallback to heuristic-only result
      result = {
        mood: avgVolume < 15 && variance < 10 ? "tired" : variance < 20 && avgPitch < 10 ? "sad" : avgVolume > 60 && variance > 80 ? "anxious" : "neutral",
        confidence: 60,
        description: "Analysis based on voice patterns only.",
        wellness_tip: "Try a few minutes of deep breathing to center yourself.",
        mental_state_indicators: [],
        suggested_action: "Open the breathing tab and try the 4-7-8 exercise.",
        urgency: "low",
        transcript_themes: [],
        phq2_flag: false,
      };
    }

    // Ensure all fields
    if (!result.mental_state_indicators) result.mental_state_indicators = [];
    if (!result.transcript_themes) result.transcript_themes = [];
    if (result.phq2_flag === undefined) result.phq2_flag = false;
    if (!result.urgency) result.urgency = "low";

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-mood error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
