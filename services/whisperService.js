// whisperService.js

const fs = require("fs");
const OpenAI = require("openai");

const openai = new OpenAI();

exports.transcribeAudio = async (audioFilePath) => {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model: "whisper-1", // Use the dedicated transcription model
    response_format: "json", 
    prompt:"The following audio is a customer placing a drink order for bubble tea.",
  });

  return transcription.text;
};