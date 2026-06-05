import { toFile } from "openai";
import { openai } from "../config/openai";

export async function transcribeAudio(audioUrl: string): Promise<string> {
  const response = await fetch(audioUrl);

  if (!response.ok) {
    throw new Error(`Erro ao baixar áudio: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const file = await toFile(Buffer.from(arrayBuffer), "whatsapp-audio.ogg", {
    type: response.headers.get("content-type") ?? "audio/ogg"
  });

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "pt"
  });

  return transcription.text;
}
