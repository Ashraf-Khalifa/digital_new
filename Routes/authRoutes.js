const express = require("express");
const router = express.Router();
const AuthController = require('../Controllers/AuthController');

// Routes for authentication
router.post("/sendotp", AuthController.sendOTP);
router.post("/verifyotp", AuthController.verifyOTP);
router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/token", AuthController.token);

module.exports = router;
