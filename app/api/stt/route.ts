export const maxDuration = 30

// Groq Whisper large-v3-turbo: blazing fast STT with Telugu + Hinglish support
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const audio = formData.get("audio") as File | null
    const language = (formData.get("language") as string) || "hinglish"

    if (!audio) {
      return Response.json({ error: "No audio provided" }, { status: 400 })
    }

    const groqForm = new FormData()
    groqForm.append("file", audio, "audio.webm")
    groqForm.append("model", "whisper-large-v3-turbo")
    groqForm.append("response_format", "json")
    groqForm.append("temperature", "0")
    // Telugu gets an explicit language hint; Hinglish is auto-detected
    // (Whisper handles Hindi-English code-switching best without a hard hint)
    if (language === "telugu") {
      groqForm.append("language", "te")
    }

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: groqForm,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[stt] Groq error:", err)
      return Response.json({ error: "Transcription failed" }, { status: 502 })
    }

    const data = await res.json()
    return Response.json({ text: (data.text || "").trim() })
  } catch (e) {
    console.error("[stt] error:", e)
    return Response.json({ error: "Transcription failed" }, { status: 500 })
  }
}
