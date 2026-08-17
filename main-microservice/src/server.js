const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/database");
const messagesRoutes = require("./routes/messages.routes");
const generateRoutes = require("./routes/generate.routes");

const app = express();

const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    service: "TeccartGPT main-microservice",
    status: "running",
  });
});

app.use("/messages", messagesRoutes);
app.use("/generate", generateRoutes);
connectDB();

app.listen(PORT, () => {
  console.log(`Main microservice démarré sur http://localhost:${PORT}`);
});
