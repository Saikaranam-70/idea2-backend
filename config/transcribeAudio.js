// const { exec } = require("child_process");
// const fs = require("fs");
// const path = require("path");

// // ✅ ABSOLUTE PATHS (MANDATORY for deployment)
// const WHISPER_EXE = "/home/ec2-user/idea2-backend/whisper.cpp/build/bin/whisper-cli";
// const MODEL_PATH = "/home/ec2-user/idea2-backend/whisper.cpp/models/ggml-small.en.bin";

// module.exports = (audioPath) => {
//   return new Promise((resolve, reject) => {
//     const outputBase = audioPath.replace(/\.wav$/, "");

//     const command = `"${WHISPER_EXE}" -m "${MODEL_PATH}" -f "${audioPath}" -otxt -of "${outputBase}"`;

//     exec(
//       command,
//       { windowsHide: true, timeout: 5 * 60 * 1000 }, // 5 minutes
//       (error) => {
//         if (error) {
//           return reject(error);
//         }

//         const txtPath = `${outputBase}.txt`;

//         if (!fs.existsSync(txtPath)) {
//           return reject(new Error("Transcription output not found"));
//         }

//         const transcript = fs.readFileSync(txtPath, "utf8").trim();

//         // ✅ cleanup
//         fs.unlinkSync(txtPath);

//         resolve(transcript);
//       },
//     );
//   });
// };

const { exec } = require("child_process");

const WHISPER_EXE =
  "/home/ec2-user/idea2-backend/whisper.cpp/build/bin/whisper-cli";
const MODEL_PATH =
  "/home/ec2-user/idea2-backend/whisper.cpp/models/ggml-tiny.en.bin";

module.exports = (audioPath) => {
  return new Promise((resolve, reject) => {
    const command = `"${WHISPER_EXE}" \
-m "${MODEL_PATH}" \
-f "${audioPath}" \
--no-gpu \
--no-flash-attn \
-t 1 \
--beam-size 1 \
--best-of 1 \
--language en`;




    exec(
      command,
      {
        timeout: 5 * 60 * 1000,
        maxBuffer: 10 * 1024 * 1024, // 10MB stdout
      },
      (error, stdout, stderr) => {
        if (error) return reject(error);

        const transcript = stdout
          .split("\n")
          .filter(
            (line) =>
              line &&
              !line.startsWith("[") &&
              !line.includes("whisper_") &&
              !line.includes("processing")
          )
          .join(" ")
          .trim();

        if (!transcript) {
          return reject(new Error("Empty transcription output"));
        }

        resolve(transcript);
      }
    );
  });
};
