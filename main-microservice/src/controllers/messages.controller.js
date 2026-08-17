const Message = require("../models/Message");

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });

    res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error("Erreur récupération messages :", error);

    res.status(500).json({
      message: "Impossible de récupérer les messages.",
    });
  }
};

module.exports = {
  getMessages,
};
