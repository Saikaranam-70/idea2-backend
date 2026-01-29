const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// ✅ ABSOLUTE PATHS (MANDATORY for deployment)
const WHISPER_EXE = "C:/whisper.cpp/build/bin/whisper-cli.exe";
const MODEL_PATH = "C:/whisper.cpp/models/ggml-small.en.bin";

module.exports = (audioPath) => {
  return new Promise((resolve, reject) => {
    const outputBase = audioPath.replace(/\.wav$/, "");

    const command = `"${WHISPER_EXE}" -m "${MODEL_PATH}" -f "${audioPath}" -otxt -of "${outputBase}"`;

    exec(
      command,
      { windowsHide: true, timeout: 5 * 60 * 1000 }, // 5 minutes
      (error) => {
        if (error) {
          return reject(error);
        }

        const txtPath = `${outputBase}.txt`;

        if (!fs.existsSync(txtPath)) {
          return reject(new Error("Transcription output not found"));
        }

        const transcript = fs.readFileSync(txtPath, "utf8").trim();

        // ✅ cleanup
        fs.unlinkSync(txtPath);

        resolve(transcript);
      },
    );
  });
};
