const tmp = require("tmp");
const fs = require("fs");
const axios = require("axios");
const path = require("path");

// const ffmpegPath = path.join(__dirname, "../vendor/ffmpeg/bin/");

export async function transcribe(openai: any, bot: any, fileId: any) {
  const file = await bot.getFile(fileId);
  const botToken = process.env.TELEGRAM_BOT_API;
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;

  const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
  const audioData = response.data;

  // Create a temporary file to store the audio data
  const tmpFile = tmp.fileSync();
  fs.writeFileSync(tmpFile.name, audioData);

  const convertedFilePath = await convertToWav(tmpFile.name);

  // Use the `createTranscription` method of the `OpenAIApi` object to transcribe the voice message
  const resp = await openai.audio.transcriptions.create({
    file: fs.createReadStream(path.resolve(convertedFilePath)),
    model: "whisper-1",
  });

  fs.unlinkSync(convertedFilePath);
  tmpFile.removeCallback();

  return resp.text;
}

async function convertToWav(audioFilePath: any) {
  const path = require("path");
  const { spawn } = require("child_process");

  const voiceMessagesDir = path.join(__dirname, "../data/voice_messages");
  if (!fs.existsSync(voiceMessagesDir)) {
    console.log("Creating directory");
    fs.mkdirSync(voiceMessagesDir, { recursive: true });
  } else {
    console.log("Directory already exists");
  }

  // Create a new file path for the converted audio file
  const convertedFilePath = path.join(
    __dirname,
    "../data/voice_messages",
    `${Date.now()}.wav`
  );

  // Convert the audio file to WAV format using `ffmpeg`
  const ffmpegProcess = spawn("ffmpeg", [
    "-i",
    audioFilePath,
    "-acodec",
    "pcm_s16le",
    "-ar",
    "16000",
    "-ac",
    "1",
    convertedFilePath,
  ]);
  await new Promise((resolve) => ffmpegProcess.on("exit", resolve));

  // Check if the file exists
  if (fs.existsSync(convertedFilePath)) {
    console.log(`File created: ${convertedFilePath}`);
  } else {
    console.error(`File not created: ${convertedFilePath}`);
  }
  // Read the converted audio file into a buffer
  return convertedFilePath;
}

export async function downloadVoice(bot: any, botToken: any, fileId: any) {
  const file = await bot.getFile(fileId);
  const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;

  const axios = require("axios");
  const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
  const audioData = response.data;

  // Save the audio data to a local file
  const filename = `${Date.now()}.oga`;
  const fs = require("fs");
  const path = require("path");
  const filePath = path.join(__dirname, "../data/voice_messages/", filename);
  fs.writeFileSync(filePath, audioData);

  return "success";
}
