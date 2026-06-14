import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

    type: {
      type: String,
      enum: [
        "comment",
        "reaction",
        "message",
        "reportResolved",
        "system"
      ],
      required: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },

    message: {
      type: String,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Notification", notificationSchema);