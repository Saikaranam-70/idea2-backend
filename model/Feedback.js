const  mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
    rating:{
        type: Number,
        required: true
    },
    type:{
        type:String,
        required:true
    },
    message:{
        type:String,
    },
    createdAt:{
        type:Date,
        default: null
    }
},{timestamps: true})

module.exports = mongoose.model("Feedback");