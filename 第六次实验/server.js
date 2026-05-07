// 引入所需模块
// Express 框架 + EJS 模板引擎 + Session 会话管理
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcrypt');

const app = express();
// 导入数据模型
// User / Travel / Comment / Notification 四个核心模型
const User = require('./models/User');
const Travel = require('./models/Travel');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');
const Setting = require('./models/Setting');

// ========== 连接 MongoDB ==========
// 以下内容由"Trae AI (DeepSeek-V4-Pro)"生成
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel';
const mongoOptions = process.env.MONGODB_URI
  ? {}
  : { auth: { username: 'huanghanyang', password: 'S20061221hhy' }, authSource: 'admin' };

// Railway 云部署：MONGODB_URI 环境变量 + PORT 自动注入
mongoose.connect(mongoURI, mongoOptions).then(async () => {
  console.log('MongoDB 连接成功');
  const existing = await Setting.findOne();
  if (!existing) await Setting.create({ heroMode: 'carousel', heroImages: ['hero11.jpg','hero121.jpg','hero211.jpg','hero111.jpg','hero1 (2).jpg','hero.jpg'], heroInterval: 5000, heroStaticImage: 'hero11.jpg' });
}).catch(err => {
  console.log('MongoDB 连接失败：', err);
});
// AI 生成结束

// 确保上传目录存在：自动创建 public/uploads 文件夹
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer 文件上传中间件：封面图 + 画廊多图
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
app.set('views', path.join(__dirname, 'views'));

// 提供静态文件服务（css、图片、前端 js 等）
app.use(express.static(path.join(__dirname, 'public')));

// 解析表单提交的数据
app.use(express.urlencoded({ extended: false }));

// express-session 会话持久化：密钥签名 + 用户信息全局注入
app.use(session({
  secret: 'travel-secret-key-2024',   // 密钥，可以随便写
  resave: false,
  saveUninitialized: false
}));

// 全局中间件：session 用户注入 + 未读通知计数
app.use(async (req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
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
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 12; // 分页：skip/limit 服务端分页，每页12条

  try {
    const total = await Travel.countDocuments();
    const totalPages = Math.ceil(total / perPage);
    const safePage = Math.max(1, Math.min(page, totalPages || 1));
    const travels = await Travel.find()
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * perPage)
      .limit(perPage);

    const hero = await Setting.findOne();

    res.render('index', { 
      title: '旅途笔记 - 首页',
      travels: travels,
      currentPage: safePage,
      totalPages: totalPages,
      query: '',
      hero: hero
    });
    
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// 全文搜索：标题 + 目的地模糊匹配 + 分页结果
app.get('/search', async (req, res) => {
  const query = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 12;
  
  try {
    const filter = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { destination: { $regex: query, $options: 'i' } }
      ]
    };
    const total = await Travel.countDocuments(filter);
    const totalPages = Math.ceil(total / perPage);
    const safePage = Math.max(1, Math.min(page, totalPages || 1));
    const travels = await Travel.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * perPage)
      .limit(perPage);
    
    const hero = await Setting.findOne();

    res.render('index', { 
      title: '搜索: ' + query + ' - 旅途笔记',
      travels: travels,
      currentPage: safePage,
      totalPages: totalPages,
      query: query,
      hero: hero
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// ========== 注册页面 ==========
app.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('register', { title: '注册 - 旅途笔记' });
});

// 处理注册表单
// 用户注册：表单验证 + bcrypt 哈希 + 自动登录
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
    req.session.user = { id: user._id, username: user.username, isAdmin: user.isAdmin };
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
// 用户登录：密码验证 + session 创建 + 重定向
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
    req.session.user = { id: user._id, username: user.username, isAdmin: user.isAdmin };
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
// 发表评论：非本人评论时自动推送通知
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
// 点赞/取消点赞：toggle 式交互，点赞后发送通知给作者
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
// 站内通知：评论/点赞/收藏事件推送 + 全部已读
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

app.post('/settings/password', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const user = await User.findById(req.session.user.id);
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.render('settings', { title: '账号设置 - 旅途笔记', user, error: '当前密码错误' });
    }
    if (newPassword !== confirmPassword) {
      return res.render('settings', { title: '账号设置 - 旅途笔记', user, error: '两次新密码不一致' });
    }
    if (newPassword.length < 6) {
      return res.render('settings', { title: '账号设置 - 旅途笔记', user, error: '新密码至少6位' });
    }
    user.password = newPassword;
    await user.save();
    res.render('settings', { title: '账号设置 - 旅途笔记', user, success: '密码修改成功！' });
  } catch (err) {
    console.error(err);
    res.redirect('/settings');
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

// 种子数据生成：10个预设用户 + 8篇游记 + 模拟点赞评论互动
app.get('/__seed__', async (req, res) => {
  try {
    const existingTravels = await Travel.countDocuments({});
    if (existingTravels > 0) {
      const existingUsers = await User.countDocuments({ email: /@travel\.com$/ });
      return res.send('<h1>数据已存在，跳过</h1><p>共 ' + existingUsers + ' 个用户 / ' + existingTravels + ' 篇游记</p>');
    }
    await User.deleteMany({ email: /@travel\.com$/ });

    const seedUsers = [
      { username: '旅行者小赵', email: 'xiaozhao@travel.com', password: '123456', bio: '一个热爱旅行的摄影爱好者，走遍千山万水。' },
      { username: '山川行者', email: 'shanchuan@travel.com', password: '123456', bio: '徒步十年，最美的风景始终在路上。' },
      { username: '吃货在路上', email: 'chihuo@travel.com', password: '123456', bio: '旅行即美食，每座城都有独特味道。' },
      { username: '小猪穷游日记', email: 'qiongyou@travel.com', password: '123456', bio: '学生党穷游攻略，花最少看最美。' },
      { username: '快门日记', email: 'kuaimen@travel.com', password: '123456', bio: '摄影师，用镜头记录每一段旅程。' },
      { username: '独自去远方', email: 'yuanfang@travel.com', password: '123456', bio: '一个人旅行，在陌生城市找自己。' },
      { username: '带着爸妈看世界', email: 'bama@travel.com', password: '123456', bio: '趁父母还走得动，多看看世界。' },
      { username: 'citywalk达人', email: 'citywalk@travel.com', password: '123456', bio: '用脚步丈量城市的每个角落。' },
    ];
    const created = [];
    for (const u of seedUsers) {
      const hashed = await bcrypt.hash(u.password, 10);
      const user = await User.create({ ...u, password: hashed });
      created.push(user);
    }

    const seed = [
      { title:'大理三日慢游记——在苍山洱海之间', destination:'大理', tags:['云南','洱海'], views:856, content:'<h2>Day 1：古城漫步</h2><p>清晨抵达大理古城，阳光洒在青石板路。住在白族民宿，推开窗就是苍山。老板递上一杯普洱——来大理，就是来慢下来的。</p><h2>Day 2：环洱海骑行</h2><p>租了电动车沿洱海环湖，经喜洲古镇吃喜洲粑粑，外酥里嫩配玫瑰酱。下午在双廊海边咖啡馆看苍山洱海，时间仿佛静止。</p><h2>Day 3：苍山索道</h2><p>坐索道上到3900米，俯瞰整个大理古城和洱海。山顶空气清冷纯净，让人来了就不想走。</p>'},
      { title:'东京自由行——从涩谷到浅草', destination:'东京', tags:['日本','美食'], views:720, content:'<h2>涩谷十字路口</h2><p>站在星巴克二楼俯瞰世界最繁忙路口，感受城市脉搏。涩谷109逛到腿软。</p><h2>浅草寺</h2><p>穿过雷门大红灯笼，仲见世商店街的人形烧和抹茶冰淇淋，满满的江户风情。</p><h2>秋叶原</h2><p>动漫天堂！手办、扭蛋、女仆咖啡厅，买了一堆海贼王手办。</p><h2>新宿夜景</h2><p>都厅展望台45楼免费俯瞰东京夜景，东京塔和晴空塔遥遥相望。</p>'},
      { title:'成都美食之旅——三天吃遍锦官城', destination:'成都', tags:['四川','火锅'], views:638, content:'<h2>Day 1：火锅之夜</h2><p>到成都第一顿必须火锅！玉林路老店红油翻滚，毛肚七上八下，嫩牛肉入口即化，辣到流汗也停不下。冰粉红糖糍粑收尾。</p><h2>Day 2：大熊猫基地</h2><p>圆滚滚的熊猫啃竹子，心都要化了。下午锦里宽窄巷子，三大炮担担面一路吃。</p><h2>Day 3：人民公园</h2><p>鹤鸣茶社喝茶搓麻将，安逸得很。临走又吃碗肥肠粉。</p>'},
      { title:'杭州西湖边的24小时', destination:'杭州', tags:['西湖','江南'], views:542, content:'<h2>出发</h2><p>高铁一小时抵杭，住龙井村民宿，推开窗是茶园。明前龙井清香扑鼻。</p><h2>苏堤晨跑</h2><p>六点沿苏堤跑步，晨雾中西湖三潭印月若隐若现，只属于早起的人。</p><h2>灵隐寺</h2><p>香火鼎盛，大雄宝殿许愿，飞来峰看石刻。素斋出乎意料好吃。</p><h2>湖滨</h2><p>夕阳把雷峰塔染成金色，来杭州是对的。</p>'},
      { title:'三亚海岛日记——阳光沙滩椰子鸡', destination:'三亚', tags:['海南','潜水'], views:890, content:'<h2>蜈支洲岛</h2><p>海水清澈见底，珊瑚和热带鱼就在身边。潜到5米深看海胆和彩色小鱼，一生难忘。</p><h2>亚龙湾</h2><p>沙滩白如面粉，躺沙滩椅喝椰子看海——度假正确打开方式。傍晚捡了几个贝壳。</p><h2>第一市场</h2><p>自买海鲜现做，人均150吃撑。椰子鸡椰汁煮出的鸡肉嫩滑香甜。</p>'},
      { title:'一个人的重庆——山城步道与火锅', destination:'重庆', tags:['山城','洪崖洞'], views:675, content:'<h2>魔幻轻轨</h2><p>2号线穿楼而过，李子坝已成打卡圣地。俯瞰嘉陵江如科幻大片。</p><h2>十八梯</h2><p>从上半城到下半城，楼梯多到怀疑人生。但老街道和江景值每一步。</p><h2>洪崖洞夜景</h2><p>金碧辉煌似宫崎骏动画，千厮门大桥上看全景，美到想哭。</p><h2>防空洞火锅</h2><p>九宫格红汤锅，毛肚鸭肠老肉片，辣到嘴麻也停不下。</p>'},
      { title:'西北大环线——从青海湖到敦煌', destination:'青海', tags:['青海湖','自驾'], views:920, content:'<h2>青海湖</h2><p>七月油菜花盛开，金色花海湛蓝湖水。天很低云很白，一切纯净得不像话。</p><h2>茶卡盐湖</h2><p>天空之镜！站盐湖拍倒影，怎么拍都好看。晚上赶到敦煌看沙漠日落。</p><h2>莫高窟</h2><p>千年壁画，飞天佛像，古人智慧让人震撼。文创飞天书签把敦煌带回家。</p><h2>鸣沙山月牙泉</h2><p>骑骆驼爬沙丘，千年不涸的清泉本身是奇迹。每一帧都值得铭记。</p>'},
      { title:'西藏朝圣——布达拉宫与大昭寺', destination:'拉萨', tags:['西藏','高原'], views:1024, content:'<h2>抵达拉萨</h2><p>飞抵感受高原清凉，八廓街慢走适应。甜茶藏面牦牛肉包子朴实难忘。</p><h2>布达拉宫</h2><p>红山上的宫殿层层叠叠庄严神圣。历代灵塔镶满宝石黄金。俯瞰全城离天很近。</p><h2>大昭寺</h2><p>磕长头的信徒额头磨茧眼神虔诚，信仰力量让人震撼。</p><h2>纳木错</h2><p>海拔4700米圣湖，湖水蓝如宝石，雪山倒映美得不真实。许愿再来。</p>'},
      { title:'厦门鼓浪屿——文艺青年的小确幸', destination:'厦门', tags:['鼓浪屿','文艺'], views:498, content:'<h2>鼓浪屿</h2><p>轮渡上岛，红砖老别墅遍布。无车只能步行，手绘地图穿小巷处处惊喜。日光岩俯瞰红瓦绿树碧海蓝天。</p><h2>张三疯奶茶</h2><p>招牌奶茶配一只懒猫，消磨一下午。盖章本一路打卡赵小姐的店、潘小莲酸奶。</p><h2>环岛路</h2><p>骑自行车海风吹过，右手大海左手绿树。曾厝垵沙茶面海蛎煎烧仙草完美收尾。</p>'},
      { title:'张家界仙境——阿凡达取景地', destination:'张家界', tags:['阿凡达','天门山'], views:780, content:'<h2>森林公园</h2><p>石英砂岩峰林拔地而起高耸入云，云雾缭绕如仙境。哈利路亚山是《阿凡达》悬浮山原型。</p><h2>金鞭溪</h2><p>徒步5公里，奇峰倒映溪中。遇到不怕人的野猴子，天然大氧吧。</p><h2>天门山</h2><p>世界最长索道7.5公里30分钟。玻璃栈道脚下万丈深渊心怦怦跳。999级天梯膝盖抖但不虚此行。</p>'},
    ];

    const travels = [];
    for (let i = 0; i < seed.length; i++) {
      const t = seed[i];
      const author = created[i % created.length];
      const travel = await Travel.create({
        ...t, author: author._id, authorName: author.username,
        createdAt: new Date(Date.now() - (seed.length - i) * 86400000),
        gallery: [], likes: [],
      });
      travels.push(travel);
    }

    function r(n) { return Math.floor(Math.random() * n); }

    for (const t of travels) {
      const likers = [];
      for (let i = 0; i < r(created.length - 1) + 3; i++) {
        const u = created[r(created.length)];
        if (!likers.find(l => l.equals(u._id)) && !u._id.equals(t.author)) likers.push(u._id);
      }
      t.likes = likers;
      await t.save();
      for (const lid of likers) {
        await Notification.create({
          recipient: t.author, sender: lid, type: 'like', travel: t._id,
          read: Math.random() > 0.5, createdAt: new Date(Date.now() - r(30) * 86400000),
        });
      }
    }

    const commentTexts = ['太美了！已经在订机票了！','写得真好，又回忆起那段时光。','收藏了！下次按你的路线走。','攻略好详细谢谢分享！','好羡慕希望我也能去。','看到美食那部分饿了哈哈！','感觉身临其境！','请问住宿大概多少钱？','这才是旅行的意义。','每次看都有新收获'];
    let cc = 0;
    for (const t of travels) {
      for (let i = 0; i < r(3) + 2; i++) {
        const commenter = created[r(created.length)];
        if (commenter._id.equals(t.author)) continue;
        const c = await Comment.create({
          travel: t._id, author: commenter._id,
          content: commentTexts[r(commentTexts.length)],
          likes: [created[r(created.length)]._id],
          createdAt: new Date(Date.now() - r(20) * 86400000),
        });
        cc++;
        await Notification.create({
          recipient: t.author, sender: commenter._id, type: 'comment', travel: t._id,
          read: Math.random() > 0.5, createdAt: c.createdAt,
        });
      }
    }

    for (const u of created) {
      u.favorites = travels.filter(() => Math.random() > 0.3).map(t => t._id).slice(0, 5);
      await u.save();
    }

    res.send('<h1>✅ 种子数据生成完毕</h1><p>用户：' + created.length + ' / 游记：' + travels.length + ' / 评论：' + cc + '</p><p>请关闭此页面</p>');
  } catch (err) {
    res.status(500).send('<h1>❌ 失败</h1><pre>' + err.message + '</pre>');
  }
});
// AI 生成结束

// ========== 管理员鉴权中间件 ==========
function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) return next();
  res.status(403).send('无权访问：需要管理员权限。请先 <a href="/login">登录</a> 管理员账号。');
}

// ========== 赋能管理员 ==========
app.get('/__makeadmin__', async (req, res) => {
  if (!req.session.user) return res.send('请先登录');
  await User.findByIdAndUpdate(req.session.user.id, { isAdmin: true });
  req.session.user.isAdmin = true;
  res.send('已设为管理员！<a href="/admin">进入后台</a>');
});

// ========== 管理员后台 ==========
app.get('/admin', requireAdmin, async (req, res) => {
  const setting = (await Setting.findOne()) || {};
  const fs = require('fs');
  const imagesDir = path.join(__dirname, 'public', 'images');
  const allImages = fs.readdirSync(imagesDir).filter(f =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
  ).filter(f => f.toLowerCase().startsWith('hero'));
  res.render('admin', { setting, allImages, currentUser: req.session.user });
});

app.post('/admin/settings', requireAdmin, async (req, res) => {
  const { heroMode, heroInterval, heroStaticImage } = req.body;
  let heroImages = req.body.heroImages;
  if (typeof heroImages === 'string') heroImages = [heroImages];
  if (!Array.isArray(heroImages)) heroImages = [];
  let setting = await Setting.findOne();
  if (!setting) setting = new Setting();
  setting.heroMode = heroMode || 'carousel';
  setting.heroImages = heroImages;
  setting.heroInterval = parseInt(heroInterval) || 5000;
  setting.heroStaticImage = heroStaticImage || '';
  await setting.save();
  res.redirect('/admin?saved=1');
});

app.post('/admin/upload', requireAdmin, (req, res) => {
  cpUpload(req, res, async (err) => {
    if (err) return res.send('上传失败: ' + err.message);
    res.redirect('/admin?uploaded=1');
  });
});

// ========== 启动服务器 ==========
// 以下内容由"Trae AI (DeepSeek-V4-Pro)"生成
const PORT = process.env.PORT || 12399;
// AI 生成结束
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});