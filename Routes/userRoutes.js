const express = require("express");
const router = express.Router();
const UserController = require("../Controllers/UserController");

// Routes for user-related actions
router.get("/:id", UserController.getUserById);
router.put("/:id", UserController.updateUserById);
router.delete("/:id", UserController.deleteUserById);

module.exports = router;
