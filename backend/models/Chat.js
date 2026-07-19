'use strict';

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['user', 'ai'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required.'],
    },
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    messages: [MessageSchema],
  },
  {
    timestamps: true,
  }
);

// Indexing for faster queries per user and search lookup
ChatSchema.index({ user: 1, isPinned: -1, updatedAt: -1 });

module.exports = mongoose.model('Chat', ChatSchema);
