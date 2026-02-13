const express = require("express")
const dotEnv = require("dotenv")
dotEnv.config();
const cors = require("cors")
const mongoose = require("mongoose")

const topicRoutes = require("./routes/topicRoutes")
const mcqRoutes = require("./routes/mcqRoutes")
const interviewRoutes = require("./routes/interview")
const userRoutes = require("./routes/userRoutes")
const jobRoutes = require("./routes/jobRoutes")
const InterviewAnswer = require("./routes/interviewAnswerRoutes")


require('./config/reminder')

const app = express();
app.use(express.json());
app.use(cors());

app.use("/topic", topicRoutes)
app.use("/mcq", mcqRoutes)
app.use("/interview", interviewRoutes)
app.use("/user", userRoutes)
app.use("/job", jobRoutes)
app.use("/answer", InterviewAnswer)


app.use("/", async(req, res)=>{
    res.send("<h1>Interview Prep </h1>")
})

mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log("MongoDB Connected Successfully")
}).catch((err)=>console.log("MongoDB Error", err))

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
    console.log("Server Running on Port", PORT)
})