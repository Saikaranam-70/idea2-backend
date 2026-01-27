const Job = require("../model/Job");
const redis = require("../config/redis");

/* ================== CREATE JOB ================== */
exports.createJob = async (req, res) => {
  try {
    const job = await Job.create(req.body);

    // ❌ clear cache (important)
    await redis.del("jobs:all");

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================== GET ALL JOBS ================== */
/*
 Query filters supported:
 ?internship=true
 ?location=Remote
 ?minStipend=5000
*/
exports.getAllJobs = async (req, res) => {
  try {
    const cacheKey = `jobs:all:${JSON.stringify(req.query)}`;

    // ✅ check redis first
    const cachedJobs = await redis.get(cacheKey);
    if (cachedJobs) {
      return res.json({
        success: true,
        fromCache: true,
        data: JSON.parse(cachedJobs),
      });
    }

    const { internship, location, minStipend } = req.query;

    let filter = {};

    if (internship !== undefined) {
      filter.isInternship = internship === "true";
    }

    if (location) {
      filter.location = location;
    }

    if (minStipend) {
      filter.stipend = { $gte: Number(minStipend) };
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    // ✅ save to redis (1 hour)
    await redis.set(cacheKey, JSON.stringify(jobs), "EX", 3600);

    res.json({
      success: true,
      fromCache: false,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================== GET JOB BY ID ================== */
exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `job:${id}`;

    const cachedJob = await redis.get(cacheKey);
    if (cachedJob) {
      return res.json({
        success: true,
        fromCache: true,
        data: JSON.parse(cachedJob),
      });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    await redis.set(cacheKey, JSON.stringify(job), "EX", 3600);

    res.json({
      success: true,
      fromCache: false,
      data: job,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid Job ID",
    });
  }
};

/* ================== UPDATE JOB ================== */
exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedJob) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // ❌ clear cache
    await redis.del(`job:${id}`);
    await redis.del("jobs:all");

    res.json({
      success: true,
      message: "Job updated successfully",
      data: updatedJob,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================== DELETE JOB ================== */
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByIdAndDelete(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // ❌ clear cache
    await redis.del(`job:${id}`);
    await redis.del("jobs:all");

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid Job ID",
    });
  }
};
