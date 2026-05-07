const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { // 接收者
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment'],
    required: true
  },
  travel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Travel',
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema); /* 通知模型：发送者/接收者/类型/已读 */