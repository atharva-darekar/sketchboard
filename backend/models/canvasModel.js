const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const canvasSchema = new mongoose.Schema(
  {
    canvasId: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Untitled",
    },
    elements: {
      type: Array,
      default: [],
    },
    history: {
      type: Array,
      default: [[]],
    },
    historyIndex: {
      type: Number,
      default: 0,
    },
    panOffset: {
      type: Object,
      default: { x: 0, y: 0 },
    },
    bgStyle: {
      type: String,
      default: "grid",
    },
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    snapshot: {
      type: String,
      default: "",
    },
  },
  { timestamps: true, collection: "canvases" },
);

module.exports = mongoose.model("Canvas", canvasSchema);
