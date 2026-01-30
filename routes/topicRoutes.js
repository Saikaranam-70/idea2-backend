const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  createTopic,
  getAllTopics,
  
  updateTopic,
  deleteTopic,
  allTopicsNames,
  getTodayTopic,
  getTopicsBySubject,
  getTopicById,
  getSubjectNameByTopicId,
  getAllTopicsInOrder,
  bulkCreateTopicsOrdered,
} = require("../controller/topicController");


const upload = multer({ dest: "uploads/" });


router.post(
  "/",
  upload.any(), 
  createTopic
);


router.get("/", getAllTopics);

router.get("/subject/:subject", getTopicsBySubject);

router.put(
  "/:id",
  upload.any(), 
  updateTopic
);

router.delete("/:id", deleteTopic);
router.get("/topic-names", allTopicsNames)
router.get("/today", getTodayTopic);
router.get("/:topicId", getTopicById)
router.get("/subject-name/:topicId", getSubjectNameByTopicId)
router.get("/topics-order", getAllTopicsInOrder)
router.post("/bulk", bulkCreateTopicsOrdered)

module.exports = router;
