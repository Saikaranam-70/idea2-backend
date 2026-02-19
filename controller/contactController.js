const Contact = require("../model/Contact");

exports.createContact = async (req, res) => {
  try {
    const { name, email, message, rating } = req.body;

    const contact = new Contact({
      name,
      email,
      message,
      rating,
    });

    await contact.save();

    return res.status(201).json({
      success: true,
      message: "Contact form submitted successfully",
      data: contact,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
