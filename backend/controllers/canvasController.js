const Canvas = require("../models/canvasModel");
const User = require("../models/userModel");

const createCanvas = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const userId = user._id;

    const { title, elements, history, historyIndex, panOffset, bgStyle } =
      req.body;

    const newCanvas = new Canvas({
      userId,
      title: title || "Untitled",
      elements: elements || [],
      history: history || [[]],
      historyIndex: historyIndex || 0,
      panOffset: panOffset || { x: 0, y: 0 },
      bgStyle: bgStyle || "grid",
    });

    const savedCanvas = await newCanvas.save();
    res.status(201).json(savedCanvas);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create canvas", error: error.message });
  }
};

const getCanvas = async (req, res) => {
  try {
    const { canvasId } = req.params;
    const canvas = await Canvas.findOne({ canvasId }).populate(
      "sharedWith",
      "name email",
    );

    if (!canvas) {
      return res.status(404).json({ message: "Canvas not found" });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const userId = user._id.toString();

    const isShared = canvas.sharedWith.some((u) => u._id.toString() === userId);
    if (canvas.userId.toString() !== userId && !isShared) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this canvas" });
    }

    res.status(200).json(canvas);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get canvas", error: error.message });
  }
};

const updateCanvas = async (req, res) => {
  try {
    const { canvasId } = req.params;
    const {
      title,
      elements,
      history,
      historyIndex,
      panOffset,
      bgStyle,
      snapshot,
    } = req.body;

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const userId = user._id.toString();

    const canvas = await Canvas.findOne({ canvasId });
    if (!canvas) {
      return res.status(404).json({ message: "Canvas not found" });
    }

    const isShared = canvas.sharedWith.some((id) => id.toString() === userId);
    if (canvas.userId.toString() !== userId && !isShared) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this canvas" });
    }

    if (title !== undefined) canvas.title = title;
    if (elements !== undefined) canvas.elements = elements;
    if (history !== undefined) canvas.history = history;
    if (historyIndex !== undefined) canvas.historyIndex = historyIndex;
    if (panOffset !== undefined) canvas.panOffset = panOffset;
    if (bgStyle !== undefined) canvas.bgStyle = bgStyle;
    if (snapshot !== undefined) canvas.snapshot = snapshot;

    const updatedCanvas = await canvas.save();
    res.status(200).json(updatedCanvas);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update canvas", error: error.message });
  }
};

const deleteCanvas = async (req, res) => {
  try {
    const { canvasId } = req.params;
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const userId = user._id.toString();

    const canvas = await Canvas.findOne({ canvasId });
    if (!canvas) {
      return res.status(404).json({ message: "Canvas not found" });
    }

    if (canvas.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this canvas" });
    }

    await Canvas.deleteOne({ canvasId });
    res.status(200).json({ message: "Canvas deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete canvas", error: error.message });
  }
};

const getUserCanvases = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const userId = user._id;

    const canvases = await Canvas.find({
      $or: [{ userId: userId }, { sharedWith: userId }],
    })
      .sort({ updatedAt: -1 })
      .select(
        "canvasId title updatedAt createdAt bgStyle snapshot userId sharedWith",
      );

    res.status(200).json(canvases);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch canvases", error: error.message });
  }
};

const shareCanvas = async (req, res) => {
  try {
    const { canvasId } = req.params;
    const { email } = req.body;

    const currentUser = await User.findOne({ email: req.user.email });
    if (!currentUser)
      return res.status(404).json({ message: "User not found" });

    const canvas = await Canvas.findOne({ canvasId });
    if (!canvas) return res.status(404).json({ message: "Canvas not found" });

    if (canvas.userId.toString() !== currentUser._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the owner can share this canvas" });
    }

    const invitee = await User.findOne({ email });
    if (!invitee)
      return res
        .status(404)
        .json({ message: "User with this email not found" });

    if (canvas.userId.toString() === invitee._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot share the canvas with yourself" });
    }

    if (canvas.sharedWith.includes(invitee._id)) {
      return res
        .status(400)
        .json({ message: "Canvas is already shared with this user" });
    }

    canvas.sharedWith.push(invitee._id);
    await canvas.save();

    const updatedCanvas = await Canvas.findOne({ canvasId }).populate(
      "sharedWith",
      "name email",
    );

    res.status(200).json(updatedCanvas);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to share canvas", error: error.message });
  }
};

const removeCollaborator = async (req, res) => {
  try {
    const { canvasId, userId: targetUserId } = req.params;

    const currentUser = await User.findOne({ email: req.user.email });
    if (!currentUser)
      return res.status(404).json({ message: "User not found" });

    const canvas = await Canvas.findOne({ canvasId });
    if (!canvas) return res.status(404).json({ message: "Canvas not found" });

    if (canvas.userId.toString() !== currentUser._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the owner can remove collaborators" });
    }

    canvas.sharedWith = canvas.sharedWith.filter(
      (id) => id.toString() !== targetUserId,
    );
    await canvas.save();

    const updatedCanvas = await Canvas.findOne({ canvasId }).populate(
      "sharedWith",
      "name email",
    );

    res.status(200).json(updatedCanvas);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to remove collaborator", error: error.message });
  }
};

module.exports = {
  createCanvas,
  getCanvas,
  updateCanvas,
  deleteCanvas,
  getUserCanvases,
  shareCanvas,
  removeCollaborator,
};
