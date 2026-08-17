const axios = require("axios");
const Message = require("../models/Message");

const generateResponse = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        message: "Le prompt est obligatoire.",
      });
    }

    // 1. Sauvegarder le message utilisateur
    const userMessage = await Message.create({
      role: "user",
      content: prompt.trim(),
    });

    console.log("Message utilisateur sauvegardé :", userMessage.content);

    // 2. Appeler la Lambda AWS
    const lambdaResponse = await axios.post(
      process.env.LAMBDA_URL,
      {
        prompt: prompt.trim(),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    console.log("Réponse Lambda reçue :", lambdaResponse.data);

    // 3. Récupérer le texte généré
    let assistantContent = lambdaResponse.data;

    // Sécurité au cas où la réponse serait encapsulée
    if (
      assistantContent &&
      typeof assistantContent === "object" &&
      assistantContent.body
    ) {
      assistantContent = assistantContent.body;
    }

    if (!assistantContent) {
      throw new Error("Aucune réponse reçue de la Lambda.");
    }

    // 4. Sauvegarder le message assistant
    const assistantMessage = await Message.create({
      role: "assistant",
      content: assistantContent,
    });

    console.log("Réponse assistant sauvegardée :", assistantMessage.content);

    await axios.post(
      `${process.env.WEBSOCKET_SERVICE_URL}/stream`,
      {
        text: assistantContent,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    console.log("Réponse envoyée au WebSocket microservice");

    return res.status(200).json({
      message: "Réponse générée avec succès.",
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error("Erreur /generate :", error.response?.data || error.message);

    return res.status(500).json({
      message: "Erreur lors du traitement du prompt.",
      error: error.response?.data || error.message,
    });
  }
};

module.exports = {
  generateResponse,
};
