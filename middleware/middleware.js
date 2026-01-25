const jwt = require("jsonwebtoken")
const User = require("../model/User")

module.exports = async(req, res, next)=>{
    try {
        const token = req.headers.authotization?.split(" ")[1];
        if(!token)
            return res.status(401).json({message: "Unauthorized"})
        const decoded = jwt.verify(token, process.env.secret_key);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}