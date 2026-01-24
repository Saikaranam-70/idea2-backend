const Redis = require("ioredis")
require("dotenv").config();

const redis = new Redis(process.env.REDIS_URL, {
    tls:{},
})

redis.on("connect", ()=> console.log("✅ Connected to Upstash Redis"));
redis.on("error", (err) => console.error("❌ Redis Error:", err));

module.exports = redis;