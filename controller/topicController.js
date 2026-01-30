const Topic = require("../model/Topic");
const redis = require("../config/redis");
const cloudinary = require("../config/cloudinary");

const CATEGORY_ORDER = [
  "OS",
  "DBMS",
  "CN",
  "OOPS",
  "DSA",
  "APTITUDE",
  "INTERVIEW",
];


/* ================= CLOUDINARY UPLOAD ================= */
const uploadToCloudinary = async (file, folder) => {
  return await cloudinary.uploader.upload(file.path, {
    folder,
    resource_type: "auto",
  });
};

/* ================= HELPER: GROUP FILES ================= */
const groupFilesByField = (files = []) => {
  return files.reduce((acc, file) => {
    if (!acc[file.fieldname]) acc[file.fieldname] = [];
    acc[file.fieldname].push(file);
    return acc;
  }, {});
};

/* ================= CREATE TOPIC ================= */
exports.createTopic = async (req, res) => {
  try {
    const { title, category, difficulty, order } = req.body;

    let descriptions = JSON.parse(req.body.descriptions || "[]");

    // ✅ Group files (IMPORTANT)
    const filesMap = groupFilesByField(req.files);

    // ✅ Upload description images
    for (let i = 0; i < descriptions.length; i++) {
      descriptions[i].images = [];

      const filesKey = `descriptionImages[${i}]`;
      if (filesMap[filesKey]) {
        for (const file of filesMap[filesKey]) {
          const uploaded = await uploadToCloudinary(
            file,
            "topics/descriptions"
          );
          descriptions[i].images.push(uploaded.secure_url);
        }
      }
    }

    // ✅ Animation upload
    let animationUrl = "";
    if (filesMap.animation) {
      const uploaded = await uploadToCloudinary(
        filesMap.animation[0],
        "topics/animations"
      );
      animationUrl = uploaded.secure_url;
    }

    const topic = await Topic.create({
      title,
      category,
      descriptions,
      difficulty,
      order,
      animationUrl,
    });

    await redis.del("topics:all");
    await redis.del("topics:names")

    res.status(201).json({
      success: true,
      message: "Topic Created Successfully",
      data: topic,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= GET ALL TOPICS ================= */
exports.getAllTopics = async (req, res) => {
  try {
    const cached = await redis.get("topics:all");

    if (cached) {
      return res.json({
        success: true,
        source: "cache",
        data: JSON.parse(cached),
      });
    }

    const topics = await Topic.find().sort({ order: 1 });

    await redis.set("topics:all", JSON.stringify(topics), "EX", 300);

    res.json({
      success: true,
      source: "db",
      data: topics,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTopicsBySubject = async (req, res) => {
  try {
    const { subject } = req.params;
    const updatedSubject = subject.toUpperCase();

    const VALID_SUBJECTS = [
      "OS",
      "DBMS",
      "CN",
      "OOPS",
      "DSA",
      "APTITUDE",
      "INTERVIEW",
    ];

    // ✅ Validate subject
    if (!VALID_SUBJECTS.includes(updatedSubject)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject",
      });
    }

    const cacheKey = `topics:subject:${updatedSubject}`;

    // ✅ Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        source: "cache",
        data: JSON.parse(cached),
      });
    }

    // ✅ Fetch topics
    const topics = await Topic.find({ category: updatedSubject })
      .sort({ order: 1 });

    // ✅ Store in cache
    await redis.set(cacheKey, JSON.stringify(topics), "EX", 300);

    res.json({
      success: true,
      source: "db",
      data: topics,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



/* ================= UPDATE TOPIC ================= */
exports.updateTopic = async (req, res) => {
  try {
    const { id } = req.params;

    let updateData = { ...req.body };

    // ✅ Group files
    const filesMap = groupFilesByField(req.files);

    if (req.body.descriptions) {
      let descriptions = JSON.parse(req.body.descriptions);

      for (let i = 0; i < descriptions.length; i++) {
        descriptions[i].images = descriptions[i].images || [];

        const filesKey = `descriptionImages[${i}]`;
        if (filesMap[filesKey]) {
          descriptions[i].images = [];

          for (const file of filesMap[filesKey]) {
            const uploaded = await uploadToCloudinary(
              file,
              "topics/descriptions"
            );
            descriptions[i].images.push(uploaded.secure_url);
          }
        }
      }

      updateData.descriptions = descriptions;
    }

    if (filesMap.animation) {
      const uploaded = await uploadToCloudinary(
        filesMap.animation[0],
        "topics/animations"
      );
      updateData.animationUrl = uploaded.secure_url;
    }

    const topic = await Topic.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    await redis.flushall();

    res.json({ success: true, data: topic });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE TOPIC ================= */
exports.deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;

    await Topic.findByIdAndDelete(id);
    await redis.flushall();

    res.json({ success: true, message: "Topic deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


/* ================= GET ALL TOPIC NAMES ================= */
exports.allTopicsNames = async (req, res) => {
  try {
    const cacheKey = "topics:names";

    // ✅ Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        source: "cache",
        data: JSON.parse(cached),
      });
    }

    // ✅ Fetch only required fields
    const topics = await Topic.find(
      {},
      { title: 1, category: 1, _id: 1 }
    ).sort({ title: 1 });

    // ✅ Store in cache
    await redis.set(cacheKey, JSON.stringify(topics), "EX", 300);

    res.json({
      success: true,
      source: "db",
      data: topics,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getTodayTopic = async (req, res) => {
  try {
    const cacheKey = "topic:today";
    await redis.del("topic:today")

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        source: "cache",
        data: JSON.parse(cached),
      });
    }

    let orderedTopics = [];

    for (const category of CATEGORY_ORDER) {
      const topics = await Topic.find({ category }).sort({ order: 1 });
      orderedTopics.push(...topics);
    }

    if (!orderedTopics.length) {
      return res.status(404).json({ success: false, message: "No topics found" });
    }

    const START_DATE = new Date("2026-01-26");
    START_DATE.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysPassed = Math.max(
      0,
      Math.floor((today - START_DATE) / (1000 * 60 * 60 * 24))
    );

    const todayTopic = orderedTopics[daysPassed % orderedTopics.length];

    await redis.set(cacheKey, JSON.stringify(todayTopic), "EX", 86400);

    res.json({
      success: true,
      source: "db",
      data: todayTopic,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



exports.getTopicById = async(req, res)=>{
  try {
    const {topicId} = req.params;
    if(!topicId)
      return res.status(400).json({message: "Topic Id Missing"})

    const cached = await redis.get(`topic:${topicId}`)
    if(cached)
      return res.status(200).json(JSON.parse(cached));

    const topic = await Topic.findById(topicId);
    if(!topic)
      return res.status(400).json({message: "Topic Not Available"});

    await redis.setex(`topic:${topicId}`, 86400, JSON.stringify(topic));
    res.status(200).json(topic)
  } catch (error) {
    return res.status(500).json({message: "Internal Server Error"})
  }
}

exports.getSubjectNameByTopicId = async (req, res) => {
  try {
    const { topicId } = req.params;

    if (!topicId) {
      return res.status(400).json({
        success: false,
        message: "Topic Id Missing",
      });
    }

    // 🔁 Check cache first
    const cached = await redis.get(`subject:${topicId}`);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // 🔍 Fetch topic from DB
    const topic = await Topic.findById(topicId).select("category title");

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    const response = {
      success: true,
      topicId,
      subject: topic.category, // OS / DBMS / CN / etc
      title: topic.title,
    };

    // 💾 Cache result (1 hour)
    await redis.set(
      `subject:${topicId}`,
      JSON.stringify(response),
      "EX",
      60 * 60
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error("getSubjectByTopicId error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getAllTopicsInOrder = async (req, res) => {
  try {
    const cacheKey = "topics:all:ordered";

    console.log("called");

    // 1️⃣ Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        source: "cache",
        data: JSON.parse(cached),
      });
    }
    console.log("called");

    // 2️⃣ Fetch topics in CATEGORY_ORDER
    let orderedTopics = [];

    for (const category of CATEGORY_ORDER) {
      const topics = await Topic.find({ category }).sort({ order: 1 }).lean();
      orderedTopics.push(...topics);
    }

    // 3️⃣ Safety check
    if (!orderedTopics.length) {
      return res.status(404).json({
        success: false,
        message: "No topics found",
      });
    }

    // 4️⃣ Cache result (24 hours)
    await redis.set(cacheKey, JSON.stringify(orderedTopics), "EX", 86400);

    // 5️⃣ Return response
    res.json({
      success: true,
      source: "db",
      count: orderedTopics.length,
      data: orderedTopics,
    });
  } catch (err) {
    console.error("❌ getAllTopicsInOrder error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.bulkCreateTopicsOrdered = async (req, res) => {
  try {
    let topics = req.body; // array

    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ message: "Invalid bulk data" });
    }

    // 1️⃣ Normalize category + order
    topics = topics.map(t => ({
      ...t,
      category: t.category.toUpperCase(),
      order: Number(t.order) || 0,
    }));

    // 2️⃣ Sort by CATEGORY_ORDER then order
    topics.sort((a, b) => {
      const catDiff =
        CATEGORY_ORDER.indexOf(a.category) -
        CATEGORY_ORDER.indexOf(b.category);

      if (catDiff !== 0) return catDiff;

      return a.order - b.order;
    });

    // 3️⃣ Insert in sorted order
    const inserted = await Topic.insertMany(topics, {
      ordered: true, // preserves insert sequence
    });

    // 4️⃣ Clear relevant cache
    await redis.del("topics:all");
    await redis.del("topics:all:ordered");
    await redis.del("topic:today");

    res.status(201).json({
      success: true,
      count: inserted.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
