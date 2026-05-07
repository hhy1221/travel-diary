const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User 模型：用户名/邮箱/密码/bio/头像/收藏
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
    bio: {
    type: String,
    default: '',
    maxlength: 200
  },
  avatar: {
    type: String,
    default: '/images/default-avatar.png'
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Travel'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 保存前自动加密密码（修正版：不使用 next 回调）
userSchema.pre('save', async function() {
  // 只有当密码被修改时才重新加密
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 验证密码的方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;