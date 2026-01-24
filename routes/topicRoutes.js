const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  createTopic,
  getAllTopics,
  getTopicsByCategory,
  updateTopic,
  deleteTopic,
  allTopicsNames,
} = require("../controller/topicController");


const upload = multer({ dest: "uploads/" });


router.post(
  "/",
  upload.any(), 
  createTopic
);


router.get("/", getAllTopics);

router.get("/category/:category", getTopicsByCategory);

router.put(
  "/:id",
  upload.any(), 
  updateTopic
);

router.delete("/:id", deleteTopic);
router.get("/topic-names", allTopicsNames)

module.exports = router;
