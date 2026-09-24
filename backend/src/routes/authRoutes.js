const express = require("express");
const { loginAdmin } = require("../controllers/authController");
const { limiteLogin } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/login", limiteLogin, loginAdmin);

module.exports = router;
