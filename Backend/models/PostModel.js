import mongoose, { Types } from "mongoose";

const replySchema = new mongoose.Schema(
  {
    user:{
        type:Types.ObjectId,
        ref:"user",
    },

    content: {
      type: String,
      required: true,
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const reactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    type: {
      type: String,
      enum: ["like", "helpful", "support"],
      default: "like",
    },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

const commentSchema = new mongoose.Schema(
  {
    user:{
        type:Types.ObjectId,
        ref:"user",
    },

    content: {
      type: String,
      required: true,
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },

    reactions: [reactionSchema],

    replies: [replySchema],

    reports: [reportSchema],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const postSchema = new mongoose.Schema(
  {
    image:{
        type:String,
        default:null
    },

    content: {
      type: String,
      required: true,
    },

    author: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },

      username: {
        type: String,
        required: true,
      },

      avatar: {
        type: String,
      },
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },

    category: {
      type: String,
      required: true,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    reactions: [reactionSchema],

    comments: [commentSchema],

    reports: [reportSchema],

    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("post", postSchema);