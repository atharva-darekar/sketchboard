const express = require("express");
const userRouter = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  refreshUserToken,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

userRouter.post("/register", registerUser);

userRouter.post("/login", loginUser);

userRouter.post("/refresh", refreshUserToken);

userRouter.get("/profile", authMiddleware, getUserProfile);

module.exports = userRouter;

