const express = require("express");
const router = express.Router();

const { generateResponse } = require("../controllers/generate.controller");

router.post("/", generateResponse);

module.exports = router;
