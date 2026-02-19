const Feedback = require("../model/Feedback");

exports.createFeedback = async (req, res) => {
  try {
    const { rating, type, message } = req.body;

    // validation
    if (!rating) {
      return res.status(400).json({
        success: false,
        message: "Rating is required",
      });
    }

    const feedback = new Feedback({
      rating,
      type,
      message,
    });

    await feedback.save();

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
