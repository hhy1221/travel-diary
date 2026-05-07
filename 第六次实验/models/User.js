const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User 模型：完整用户数据，支持邮箱/密码注册 + GitHub OAuth 第三方登录
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false
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
  githubId: {
    type: String,
    unique: true,
    sparse: true
  },
  githubUsername: {
    type: String,
    default: ''
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Travel'
  }],
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 保存前自动加密密码（修正版：不使用 next 回调）
UserSchema.pre('save', async function() {
  // 只有当密码被修改时才重新加密
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 验证密码的方法
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);
module.exports = User;