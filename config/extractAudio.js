const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = (videoPath, audioPath) => {
  return new Promise((resolve, reject) => {
    try {
      // ✅ Ensure output directory exists
      const outputDir = path.dirname(audioPath);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      ffmpeg(videoPath)
        .audioCodec("pcm_s16le")
        .audioChannels(1)
        .audioFrequency(16000)
        .format("wav")
        .output(audioPath)
        .on("end", () => {
          console.log("✅ Audio extracted:", audioPath);
          resolve(audioPath);
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg error:", err);
          reject(err);
        })
        .run();
    } catch (err) {
      reject(err);
    }
  });
};
