'use strict';

const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../config/constants');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required.'],
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: [true, 'Notification type is required.'],
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters.'],
    },
    message: {
      type: String,
      required: [true, 'Message is required.'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters.'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // The entity this notification is about
    relatedEntity: {
      model: {
        type: String,
        enum: ['Appointment', 'Patient', 'Inventory', 'Report', 'HealthCenter', 'User', null],
        default: null,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },
    // Optional action URL for the front-end
    actionUrl: {
      type: String,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
NotificationSchema.index({ recipient: 1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ─── Virtual ─────────────────────────────────────────────────────────────────
NotificationSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > new Date(this.expiresAt);
});

module.exports = mongoose.model('Notification', NotificationSchema);
