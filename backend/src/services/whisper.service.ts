import { toFile } from "openai";
import { openai } from "../config/openai";

export async function transcribeAudio(
  input: string,
  mimeType = "audio/ogg"
): Promise<string> {
  const normalizedInput = input.trim();

  if (!normalizedInput) {
    return "";
  }

  const audio = normalizedInput.startsWith("http")
    ? await downloadAudio(normalizedInput, mimeType)
    : decodeBase64Audio(normalizedInput, mimeType);
  const file = await toFile(audio.buffer, getAudioFilename(audio.mimeType), {
    type: audio.mimeType
  });

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    language: "pt"
  });

  return transcription.text;
}

async function downloadAudio(url: string, fallbackMimeType: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erro ao baixar áudio: HTTP ${response.status}`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    mimeType: normalizeMimeType(
      response.headers.get("content-type") ?? fallbackMimeType
    )
  };
}

function decodeBase64Audio(input: string, fallbackMimeType: string) {
  const dataUrlMatch = input.match(/^data:([^;,]+);base64,(.+)$/s);
  const encodedAudio = dataUrlMatch?.[2] ?? input;
  const buffer = Buffer.from(encodedAudio, "base64");

  if (buffer.length === 0) {
    throw new Error("Áudio base64 vazio ou inválido.");
  }

  return {
    buffer,
    mimeType: normalizeMimeType(dataUrlMatch?.[1] ?? fallbackMimeType)
  };
}

function normalizeMimeType(mimeType: string) {
  return mimeType.split(";")[0]?.trim() || "audio/ogg";
}

function getAudioFilename(mimeType: string) {
  const extensions: Record<string, string> = {
    "audio/aac": "aac",
    "audio/m4a": "m4a",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/opus": "opus",
    "audio/wav": "wav",
    "audio/webm": "webm"
  };

  return `whatsapp-audio.${extensions[mimeType] ?? "ogg"}`;
}
