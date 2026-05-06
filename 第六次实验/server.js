// 引入所需模块
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
// 引入用户模型
const User = require('./models/User');
const Travel = require('./models/Travel');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');

// ========== 连接 MongoDB ==========
// 以下内容由"Trae AI (DeepSeek-V4-Pro)"生成
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel';
const mongoOptions = process.env.MONGODB_URI
  ? {}
  : { auth: { username: 'huanghanyang', password: 'S20061221hhy' }, authSource: 'admin' };

mongoose.connect(mongoURI, mongoOptions).then(() => {
  console.log('MongoDB 连接成功');
}).catch(err => {
  console.log('MongoDB 连接失败：', err);
});
// AI 生成结束

// ========== 确保上传文件夹存在 ==========
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });
const cpUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]);


// ========== 中间件配置 ==========
// 设置模板引擎为 ejs
app.set('view engine', 'ejs');

// 提供静态文件服务（css、图片、前端 js 等）
app.use(express.static(path.join(__dirname, 'public')));

// 解析表单提交的数据
app.use(express.urlencoded({ extended: false }));

// 配置 session（用于保持登录状态）
app.use(session({
  secret: 'travel-secret-key-2024',   // 密钥，可以随便写
  resave: false,
  saveUninitialized: false
}));

// 将 session 中的用户信息传给所有页面
app.use(async (req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  if (req.session.user) {
    try {
      const unreadCount = await Notification.countDocuments({
        recipient: req.session.user.id,
        read: false
      });
      res.locals.unreadCount = unreadCount;
    } catch (err) {
      res.locals.unreadCount = 0;
    }
  } else {
    res.locals.unreadCount = 0;
  }
  next();
});

// ========== 路由：首页 ==========
app.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;   // 当前页，默认第1页
  const limit = 4;   // 每页显示4篇（你可根据需要调整）
  
  try {
    const total = await Travel.countDocuments();
    const travels = await Travel.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    res.render('index', { 
      title: '旅途笔记 - 首页',
      travels: travels,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      query: ''
    });
    
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// ========== 搜索游记 ==========
app.get('/search', async (req, res) => {
  const query = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  const limit = 4;
  
  try {
    const filter = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { destination: { $regex: query, $options: 'i' } }
      ]
    };
    const total = await Travel.countDocuments(filter);
    const travels = await Travel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    res.render('index', { 
      title: '搜索: ' + query + ' - 旅途笔记',
      travels: travels,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      query: query
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// ========== API：加载更多游记（无限滚动） ==========
app.get('/api/travels', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 4;  // 每页数量，与首页一致
  try {
    const travels = await Travel.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();  // 返回普通 JS 对象，提高性能
    res.json(travels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '加载失败' });
  }
});
// ========== 注册页面 ==========
app.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('register', { title: '注册 - 旅途笔记' });
});

// 处理注册表单
app.post('/register', async (req, res) => {
  try {
    console.log('===== 注册请求开始 =====');
    console.log('请求体:', req.body);

    const { username, email, password, password2 } = req.body;
    
    // 简单校验
    if (password !== password2) {
      return res.render('register', { 
        title: '注册 - 旅途笔记',
        error: '两次密码输入不一致' 
      });
    }
    
    // 检查用户名或邮箱是否已存在
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.render('register', { 
        title: '注册 - 旅途笔记',
        error: '用户名或邮箱已被注册' 
      });
    }
    
    // 创建用户（密码会自动加密）
    const user = new User({ username, email, password });
    await user.save();
    
    // 注册成功后直接登录
    req.session.user = { id: user._id, username: user.username };
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('register', { 
      title: '注册 - 旅途笔记',
      error: '注册失败，请稍后再试' 
    });
  }
});

// ========== 登录页面 ==========
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { title: '登录 - 旅途笔记' });
});

// 处理登录表单
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('login', { 
        title: '登录 - 旅途笔记',
        error: '用户名或密码错误' 
      });
    }
    
    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('login', { 
        title: '登录 - 旅途笔记',
        error: '用户名或密码错误' 
      });
    }
    
    // 登录成功
    req.session.user = { id: user._id, username: user.username };
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('login', { 
      title: '登录 - 旅途笔记',
      error: '登录失败，请稍后再试' 
    });
  }
});
// ========== 发布游记页面 ==========
app.get('/create', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('create', { title: '写游记 - 旅途笔记' });
});

// 处理游记发布（使用 cpUpload 同时接收封面图和多张图片）
app.post('/create', cpUpload, async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const { title, destination, content, category } = req.body;
    const travel = new Travel({
      title, destination, content, category,
      author: req.session.user.id,
      authorName: req.session.user.username
    });
    
    // 处理封面图（字段名为 image）
    if (req.files['image'] && req.files['image'].length > 0) {
      travel.image = '/uploads/' + req.files['image'][0].filename;
    }
    
    // 处理多张图片（字段名为 gallery）
    if (req.files['gallery'] && req.files['gallery'].length > 0) {
      travel.gallery = req.files['gallery'].map(file => '/uploads/' + file.filename);
    }
    
    await travel.save();
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('create', { 
      title: '写游记 - 旅途笔记', 
      error: '发布失败，请稍后再试' 
    });
  }
});


// ========== 游记详情页 ==========
app.get('/travel/:id', async (req, res) => {
  try {
    const travel = await Travel.findById(req.params.id).populate('author');
    if (!travel) return res.status(404).send('游记不存在');
    
    const comments = await Comment.find({ travel: travel._id }).sort({ createdAt: -1 });
    
    // 相关推荐：相同目的地，排除当前游记，最多4篇
    const relatedTravels = await Travel.find({
      destination: travel.destination,
      _id: { $ne: travel._id }
    }).limit(4).lean();
    
    // 获取当前用户的收藏列表
    let favorites = [];
    if (req.session.user) {
      const user = await User.findById(req.session.user.id);
      if (user) favorites = user.favorites;
    }
    
    res.render('detail', { 
      title: travel.title + ' - 旅途笔记',
      travel: travel,
      comments: comments,
      favorites: favorites,
      relatedTravels: relatedTravels
    });
  } catch (err) {
    console.error(err);
    res.status(404).send('游记不存在');
  }
});
// 提交评论
app.post('/travel/:id/comment', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const travel = await Travel.findById(req.params.id);
    if (!travel) return res.status(404).send('游记不存在');

    const comment = new Comment({
      content: req.body.content,
      author: req.session.user.id,
      authorName: req.session.user.username,
      travel: travel._id
    });
    await comment.save();

    // 如果不是给自己评论，就发通知给游记作者
    if (travel.author.toString() !== req.session.user.id) {
      await Notification.create({
        recipient: travel.author,
        sender: req.session.user.id,
        type: 'comment',
        travel: travel._id
      });
    }

    res.redirect('/travel/' + travel._id);
  } catch (err) {
    console.error(err);
    res.redirect('/travel/' + req.params.id);
  }
});
// ========== 编辑游记页面 ==========
app.get('/travel/:id/edit', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  
  try {
    const travel = await Travel.findById(req.params.id);
    if (!travel) return res.status(404).send('游记不存在');
    // 验证作者身份
    if (travel.author.toString() !== req.session.user.id) {
      return res.status(403).send('没有权限编辑');
    }
    res.render('edit', { 
      title: '编辑 - ' + travel.title,
      travel: travel,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// 处理编辑提交
app.post('/travel/:id/edit', cpUpload, async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  
  try {
    const travel = await Travel.findById(req.params.id);
    if (!travel) return res.status(404).send('游记不存在');
    if (travel.author.toString() !== req.session.user.id) {
      return res.status(403).send('没有权限编辑');
    }
    
    const { title, destination, content, category } = req.body;
    travel.title = title;
    travel.destination = destination;
    travel.content = content;
    travel.category = category;
    
    // 如果上传了新封面图，替换旧封面图
    if (req.files['image'] && req.files['image'].length > 0) {
      travel.image = '/uploads/' + req.files['image'][0].filename;
    }
    
    // 如果上传了新的多张图片，替换旧画廊
    if (req.files['gallery'] && req.files['gallery'].length > 0) {
      travel.gallery = req.files['gallery'].map(file => '/uploads/' + file.filename);
    }
    
    await travel.save();
    res.redirect('/travel/' + travel._id);
  } catch (err) {
    console.error(err);
    const travel = await Travel.findById(req.params.id);
    res.render('edit', { 
      title: '编辑 - ' + travel.title,
      travel: travel,
      error: '更新失败，请稍后再试'
    });
  }
});
// ========== 点赞/取消点赞 ==========
app.post('/travel/:id/like', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const travel = await Travel.findById(req.params.id);
    if (!travel) return res.status(404).send('游记不存在');

    const userId = req.session.user.id;
    const index = travel.likes.indexOf(userId);

    if (index === -1) {
      // 点赞
      travel.likes.push(userId);
      await travel.save();

      // 如果不是给自己点赞，就发通知给游记作者
      if (travel.author.toString() !== userId) {
        await Notification.create({
          recipient: travel.author,
          sender: userId,
          type: 'like',
          travel: travel._id
        });
      }
    } else {
      // 取消点赞
      travel.likes.splice(index, 1);
      await travel.save();
    }

    res.redirect('/travel/' + travel._id);
  } catch (err) {
    console.error(err);
    res.redirect('/travel/' + req.params.id);
  }
});
// ========== 收藏/取消收藏 ==========
app.post('/travel/:id/favorite', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return res.redirect('/login');
    
    const travelId = req.params.id;
    const index = user.favorites.indexOf(travelId);
    
    if (index === -1) {
      user.favorites.push(travelId);
    } else {
      user.favorites.splice(index, 1);
    }
    
    await user.save();
    res.redirect('/travel/' + travelId);
  } catch (err) {
    console.error(err);
    res.redirect('/travel/' + req.params.id);
  }
});
// ========== 删除游记 ==========
app.post('/travel/:id/delete', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  
  try {
    const travel = await Travel.findById(req.params.id);
    if (!travel) return res.status(404).send('游记不存在');
    if (travel.author.toString() !== req.session.user.id) {
      return res.status(403).send('没有权限删除');
    }
    await travel.deleteOne();
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});
// ========== 个人中心 ==========
app.get('/my', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  
  try {
    const myTravels = await Travel.find({ author: req.session.user.id }).sort({ createdAt: -1 });
    
    const user = await User.findById(req.session.user.id).populate('favorites');
    
    res.render('my', { 
      title: '我的 - 旅途笔记',
      myTravels: myTravels,
      favorites: user ? user.favorites : []
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});
// ========== 用户个人主页 ==========
app.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('用户不存在');
    
    const travels = await Travel.find({ author: user._id }).sort({ createdAt: -1 });
    const favorites = await Travel.find({ _id: { $in: user.favorites } }).sort({ createdAt: -1 });
    
    res.render('user', {
      title: user.username + ' 的个人主页 - 旅途笔记',
      profileUser: user,
      travels: travels,
      favorites: favorites
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});
// ========== 评论点赞/取消点赞 ==========
app.post('/comment/:id/like', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).send('评论不存在');

    const userId = req.session.user.id;
    const index = comment.likes.indexOf(userId);

    if (index === -1) {
      comment.likes.push(userId);
    } else {
      comment.likes.splice(index, 1);
    }

    await comment.save();
    // 完成后重定向回游记详情页（需要知道 travel id）
    res.redirect('/travel/' + comment.travel);
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});
// ========== 通知列表 ==========
app.get('/notifications', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const notifications = await Notification.find({ recipient: req.session.user.id })
      .populate('sender', 'username')
      .populate('travel', 'title')
      .sort({ createdAt: -1 });
    
    res.render('notifications', { 
      title: '通知 - 旅途笔记',
      notifications: notifications
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// 全部标记为已读
app.post('/notifications/read-all', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await Notification.updateMany(
      { recipient: req.session.user.id, read: false },
      { read: true }
    );
    res.redirect('/notifications');
  } catch (err) {
    console.error(err);
    res.redirect('/notifications');
  }
});

// ========== 个人设置页面 ==========
app.get('/settings', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const user = await User.findById(req.session.user.id);
    res.render('settings', { title: '个人设置 - 旅途笔记', user: user });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// 处理设置提交
app.post('/settings', upload.single('avatar'), async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return res.redirect('/login');

    // 更新简介
    user.bio = req.body.bio || '';

    // 更新头像（如果上传了文件）
    if (req.file) {
      user.avatar = '/uploads/' + req.file.filename;
    }

    await user.save();
    res.render('settings', { 
      title: '个人设置 - 旅途笔记', 
      user: user,
      success: '修改已保存！' 
    });
  } catch (err) {
    console.error(err);
    res.render('settings', { 
      title: '个人设置 - 旅途笔记', 
      user: await User.findById(req.session.user.id),
      error: '保存失败，请稍后再试' 
    });
  }
});
// ========== 功能介绍页面 ==========
app.get('/features', (req, res) => {
  res.render('features', { title: '功能介绍 - 旅途笔记' });
});
// ========== 退出登录 ==========
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// ========== 启动服务器 ==========
// 以下内容由"Trae AI (DeepSeek-V4-Pro)"生成
const PORT = process.env.PORT || 12399;
// AI 生成结束
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});