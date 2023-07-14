const express = require("express");

const { verifyEmail, resendVerifyEmail } = require("../../controllers/authController");

const router = express.Router();

router.get("/verify/:verificationToken", verifyEmail);

router.post("/verify", resendVerifyEmail);

module.exports = router;