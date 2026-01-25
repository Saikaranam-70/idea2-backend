const User = require("../model/User")
const jwt = require("jsonwebtoken")
const redis = require("../config/redis")
const nodemailer = require("nodemailer")

const generateOTP = () =>
  Math.floor(1000 + Math.random() * 9000).toString();

const generateToken = (userId) =>
    jwt.sign({id: userId}, process.env.secret_key);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth:{
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD
    }
})

const sendOTPEmail = async(email, otp)=>{
    await transporter.sendMail({
        from: `"Prep App" <${process.env.EMAIL}`,
        to: email,
        subject: "Your Login OTP",
        html: `
      <h2>Prep App</h2>
      <h1>${otp}</h1>
      <p>OTP valid for 5 minutes</p>
    `
    })
}

exports.sendOTP = async(req, res)=>{
    const {email} = req.body;
    if(!email)
        return res.status(400).json({message:"Email is required"})

    // const alreadySent = await redis.get(`otp:${email}`);
    // if(alreadySent)
    //     return res.status(429).json({message:"OTP Already Sent"});

    const otp = generateOTP();
    console.log(otp)

    await redis.setex(`otp:${email}`, 300, otp);
    await sendOTPEmail(email, otp);
    res.json({message: "OTP sent successfully"})
}

exports.verifyOTP = async(req, res)=>{
    const {email, otp} = req.body;

    const savedOTP = await redis.get(`otp:${email}`);
    if(!savedOTP || savedOTP !== otp){
        return res.status(400).json({message: "Invalid or expired OTP"});
    }

    let user = await User.findOne({email});
    if(!user){
        user = await User.create({
            email
        });
    }

    await redis.del(`otp:${email}`);
    

    const token = generateToken(user._id);
    await redis.setex(`user:${user._id}`, 3600, JSON.stringify(user));
    const isProfileComplete = user.isProfileComplete

    res.json({
        token, isProfileComplete, user
    })
}

exports.completeProfile = async(req, res)=>{
    try {
        const {name, username} = req.body;

        if(!name || !username)
            return res.status(400).json({message: "Name and username is required"})

        const usernameExists = await User.findOne({username});
        if(usernameExists)
            return res.status(400).json({message: "username is already exists"})

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                name, username, isProfileComplete: true
            },{
                new: true
            }
        )

        await redis.del(`user:${user._id}`)
        res.json({user});
    } catch (error) {
        return res.status(500).json({message: "Internal Server Error"})
    }
}

exports.checkUsername = async(req, res)=>{
    try {
        const {username} = req.query;

        if(!username)
            return res.status(400).json({available: false})

        const exists = await User.findOne({username});
        res.status(200).json({available: !exists});

    } catch (error) {
        return res.status(500).json({message: "Internal Server Error"})
    }
}

exports.getProfile = async(req, res)=>{
    try {
        const cached = await redis.get(`user:${req.user._id}`);
        if(cached) return res.status(200).json(JSON.parse(cached));

        const user = await User.findById(req.user._id);

        await redis.setex(`user:${user._id}`, 3600, JSON.stringify(user));
        res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({message: "Internal Server Error"})
    }
}

exports.logout = async (req, res) => {
  await redis.del(`user:${req.user._id}`);
  res.json({ message: "Logged out successfully" });
};
