const express = require("express");
const canvasRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createCanvas,
  getCanvas,
  updateCanvas,
  deleteCanvas,
  getUserCanvases,
  shareCanvas,
  removeCollaborator,
} = require("../controllers/canvasController");


canvasRouter.use(authMiddleware);

canvasRouter.post("/", createCanvas);
canvasRouter.get("/", getUserCanvases);
canvasRouter.get("/:canvasId", getCanvas);
canvasRouter.put("/:canvasId", updateCanvas);
canvasRouter.delete("/:canvasId", deleteCanvas);
canvasRouter.post("/:canvasId/share", shareCanvas);
canvasRouter.delete("/:canvasId/share/:userId", removeCollaborator);

module.exports = canvasRouter;
