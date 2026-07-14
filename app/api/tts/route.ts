export const maxDuration = 30

// Sarvam AI bulbul:v2 — the most realistic free-tier Telugu/Hinglish voices
export async function POST(req: Request) {
  try {
    const { text, language = "hinglish", voice = "abhilash" } = await req.json()

    if (!text || typeof text !== "string" || !text.trim()) {
      return Response.json({ error: "No text provided" }, { status: 400 })
    }

    const targetLang = language === "telugu" ? "te-IN" : "hi-IN"

    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": process.env.SARVAM_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.slice(0, 1500),
        target_language_code: targetLang,
        speaker: voice,
        model: "bulbul:v2",
        pitch: 0,
        pace: 1.0,
        loudness: 1.2,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[tts] Sarvam error:", res.status, err)
      return Response.json({ error: "TTS failed" }, { status: 502 })
    }

    const data = await res.json()
    const base64Audio = data.audios?.[0]
    if (!base64Audio) {
      return Response.json({ error: "No audio returned" }, { status: 502 })
    }

    const audioBuffer = Buffer.from(base64Audio, "base64")
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    console.error("[tts] error:", e)
    return Response.json({ error: "TTS failed" }, { status: 500 })
  }
}
