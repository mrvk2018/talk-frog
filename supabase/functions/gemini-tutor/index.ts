import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TutorPayload = {
  lessonTitle: string;
  targetPhrase: string;
  spokenText: string;
  levenshteinPercent: number;
  passThreshold: number;
  systemPrompt: string;
  studentQuestion?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.0-flash";

    const body = (await req.json()) as TutorPayload;
    const {
      lessonTitle,
      targetPhrase,
      spokenText,
      levenshteinPercent,
      passThreshold,
      systemPrompt,
      studentQuestion,
    } = body;

    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userPrompt = `Lesson: ${lessonTitle}
Target phrase: ${targetPhrase}
Student said: ${spokenText}
Levenshtein similarity: ${levenshteinPercent}%
Pass threshold: ${passThreshold}%
Student question: ${studentQuestion ?? "none"}

Respond ONLY with JSON:
{
  "feedbackRu": string,
  "tipRu": string,
  "recommendedMastery": "learning" | "good" | "mastered",
  "finalScorePercent": number
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const details = await geminiRes.text();
      return new Response(JSON.stringify({ error: "Gemini API error", details }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiJson = await geminiRes.json();
    const text =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "";

    const parsed = JSON.parse(text);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});