const mongoose = require("mongoose");

const PostSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  ingredients: [{
    name: {
      type: String,
      required: true
    },
    amount: {
      type: Number
    },
    unit: {
      type: String
    }
  }],
  directions: {
    type: String,
  },
  comments: [{
    comment: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    points: {
      type: Number
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    reply: [{
      comment: {
        type: String,
        required: true
      },
      userId: {
        type: String,
        required: true
      },
      points: {
        type: Number
      },
      createdAt: {
        type: Date,
        default: Date.now()
      }
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now()
  },
  updatedAt: {
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model("post", PostSchema);