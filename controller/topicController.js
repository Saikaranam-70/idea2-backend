const Topic = require("../model/Topic");
const redis = require("../config/redis");
const cloudinary = require("../config/cloudinary");

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

/* ================= GET BY CATEGORY ================= */
exports.getTopicsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const cacheKey = `topics:${category}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        source: "cache",
        data: JSON.parse(cached),
      });
    }

    const topics = await Topic.find({ category }).sort({ order: 1 });

    await redis.set(cacheKey, JSON.stringify(topics), "EX", 300);

    res.json({ success: true, data: topics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
