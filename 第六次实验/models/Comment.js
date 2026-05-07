const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: { // 评论内容
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  travel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Travel',
    required: true
  },
    likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comment', commentSchema);