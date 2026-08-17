const express = require("express");
const router = express.Router();

const { getMessages } = require("../controllers/messages.controller");

router.get("/", getMessages);

module.exports = router;
