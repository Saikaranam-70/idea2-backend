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
const fs = require("fs");

// Absolute paths
const WHISPER_EXE =
  "/home/ec2-user/idea2-backend/whisper.cpp/build/bin/whisper-cli";
const MODEL_PATH =
  "/home/ec2-user/idea2-backend/whisper.cpp/models/ggml-small.en.bin";

module.exports = (audioPath) => {
  return new Promise((resolve, reject) => {
    const outputBase = audioPath.replace(/\.wav$/, "");
    const txtPath = `${outputBase}.txt`;

    const command = `"${WHISPER_EXE}" \
-m "${MODEL_PATH}" \
-f "${audioPath}" \
-otxt \
-of "${outputBase}" \
--no-gpu \
--no-mmap \
--flash-attn 0 \
-t 1`;

    exec(command, { timeout: 5 * 60 * 1000 }, (error) => {
      if (error) return reject(error);

      if (!fs.existsSync(txtPath)) {
        return reject(new Error("Transcription output not found"));
      }

      console.log(command)

      const transcript = fs.readFileSync(txtPath, "utf8").trim();
      fs.unlinkSync(txtPath);

      resolve(transcript);
    });
  });
};
