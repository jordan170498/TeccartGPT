require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const wss = new WebSocket.Server({ server });

app.get("/", (req, res) => {
  res.status(200).json({
    message: "WebSocket microservice opérationnel",
  });
});

wss.on("connection", (ws) => {
  console.log("Client WebSocket connecté");

  ws.on("close", () => {
    console.log("Client WebSocket déconnecté");
  });

  ws.on("error", (error) => {
    console.error("Erreur WebSocket :", error.message);
  });
});

const broadcastChunk = (chunk) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(chunk);
    }
  });
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.post("/stream", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Le texte à diffuser est obligatoire.",
      });
    }

    console.log("Début du streaming");

    const words = text.split(" ");

    for (const word of words) {
      broadcastChunk(word + " ");
      await wait(40);
    }

    console.log("Streaming terminé");

    return res.status(200).json({
      message: "Streaming terminé.",
      chunks: words.length,
    });
  } catch (error) {
    console.error("Erreur streaming :", error);

    return res.status(500).json({
      message: "Erreur lors du streaming.",
    });
  }
});

server.listen(PORT, () => {
  console.log(`WebSocket microservice démarré sur http://localhost:${PORT}`);
});
