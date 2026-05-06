const mongoose = require('mongoose');

const travelSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: '/images/default-travel.jpg'
  },
  gallery: [{
    type: String
  }],
  category: {
    type: String,
    enum: ['自然风光', '城市漫步', '美食之旅', '历史文化', '其他'],
    default: '其他'
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
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Travel = mongoose.model('Travel', travelSchema);
module.exports = Travel;