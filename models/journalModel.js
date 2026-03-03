const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Journal must belong to a user"],
      index: true,
    },

    title: { type: String, trim: true, maxlength: 120 },
    content: {
      type: String,
      required: [true, "content là bắt buộc"],
      trim: true,
    },

    mood: {
      type: String,
      enum: ["happy", "sad", "angry", "anxious", "neutral", "excited", "tired"],
      default: "neutral",
      index: true,
    },

    tags: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],

    entryDate: { type: Date, default: Date.now, index: true },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    isPublic: { type: Boolean, default: false, index: true },
  },

  { timestamps: true },
);

journalSchema.index({ user: 1, entryDate: -1 });

module.exports = mongoose.model("Journal", journalSchema);
