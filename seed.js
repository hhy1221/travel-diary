// 独立种子脚本：10个用户 + 11篇游记 + 评论点赞收藏通知 全自动生成
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel';
const MONGO_OPTIONS = process.env.MONGODB_URI
  ? {}
  : { auth: { username: 'huanghanyang', password: 'S20061221hhy' }, authSource: 'admin' };

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '/images/default-avatar.png' },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Travel' }],
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const TravelSchema = new mongoose.Schema({
  title: String,
  destination: String,
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gallery: [String],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
  travel: { type: mongoose.Schema.Types.ObjectId, ref: 'Travel' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['like', 'comment'] },
  travel: { type: mongoose.Schema.Types.ObjectId, ref: 'Travel' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Travel = mongoose.model('Travel', TravelSchema);
const Comment = mongoose.model('Comment', CommentSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

const users = [
  { username: '旅行者小赵', email: 'xiaozhao@travel.com', password: '123456', bio: '一个热爱旅行的摄影爱好者，走遍千山万水，只为记录最美的瞬间。', avatar: '/images/default-avatar.png' },
  { username: '山川行者', email: 'shanchuan@travel.com', password: '123456', bio: '徒步十年，攀登过峨眉、黄山、泰山。最美的风景永远在路上。', avatar: '/images/default-avatar.png' },
  { username: '吃货在路上', email: 'chihuo@travel.com', password: '123456', bio: '旅行的意义就是吃！每个城市都有独特的味道。', avatar: '/images/default-avatar.png' },
  { username: '小猪穷游日记', email: 'qiongyou@travel.com', password: '123456', bio: '学生党穷游攻略分享，花最少的钱看最美的风景。', avatar: '/images/default-avatar.png' },
  { username: '快门日记', email: 'kuaimen@travel.com', password: '123456', bio: '专业摄影师，用镜头讲述每一段旅程的故事。', avatar: '/images/default-avatar.png' },
  { username: '独自去远方', email: 'yuanfang@travel.com', password: '123456', bio: '喜欢一个人旅行，在陌生的城市里寻找自己。', avatar: '/images/default-avatar.png' },
  { username: '带着爸妈看世界', email: 'bama@travel.com', password: '123456', bio: '带父母去旅行，趁他们还走得动，多看看这个世界。', avatar: '/images/default-avatar.png' },
  { username: 'citywalk达人', email: 'citywalk@travel.com', password: '123456', bio: '不跟团不打卡，用脚步丈量城市的每一个角落。', avatar: '/images/default-avatar.png' },
];

const travels = [
  {
    title: '大理三日慢游记——在苍山洱海之间',
    destination: '大理',
    tags: ['云南', '洱海', '古城', '慢生活'],
    views: 856,
    content: `<h2>Day 1：古城漫步</h2><p>清晨抵达大理古城，阳光洒在青石板路上，空气中弥漫着花香。住在古城里的一家白族民宿，推开窗就是苍山。老板热情地端上一杯普洱茶，告诉我"来大理，就是来慢下来的"。</p><p>沿着人民路一直走，两边是各种手工艺小店和咖啡馆。路过一家卖扎染的铺子，老板娘正在亲手制作，蓝色的染料在白色的布上晕开，像极了洱海的波浪。</p><p>傍晚去了古城南门，晚霞把苍山染成了金色，这样的美景，值得停下来好好看一看。</p><h2>Day 2：环洱海骑行</h2><p>租了一辆电动车，沿着洱海环湖。从古城出发，经过喜洲古镇，吃了著名的喜洲粑粑，外酥里嫩，配上玫瑰酱，完美！</p><p>下午到了双廊，坐在海边的咖啡馆，看着波光粼粼的洱海和对岸的苍山，时间仿佛静止了。这里有很多网红拍照点，随手一拍都是大片。</p><h2>Day 3：苍山索道</h2><p>坐苍山大索道上山，从海拔2000米一直升到3900米。山顶的空气清冷而纯净，俯瞰整个洱海和大理古城，壮美无比。这是一个让人来了就不想走的地方。</p>`,
  },
  {
    title: '东京自由行全攻略——从涩谷到浅草',
    destination: '东京',
    tags: ['日本', '东京', '美食', '购物'],
    views: 720,
    content: `<h2>第一站：涩谷十字路口</h2><p>东京的第一站必须是涩谷！站在星巴克二楼俯瞰那个世界最繁忙的十字路口，看着人潮如织，感受这座城市的脉搏。涩谷109、LOFT、东急手创馆，逛到腿软也停不下来。</p><h2>第二站：浅草寺与雷门</h2><p>第二天一早去了浅草寺，穿过雷门的大红灯笼，两边是琳琅满目的仲见世商店街。买了人形烧和抹茶冰淇淋，满满的江户风情。在这里抽了一支签，是大吉！</p><h2>第三站：秋叶原宅文化</h2><p>作为一个动漫迷，秋叶原是天堂。整条街都是电器店和动漫周边店，手办、扭蛋、女仆咖啡厅……买了一堆海贼王的手办，钱包在哭但是心在笑。</p><h2>第四站：新宿夜景</h2><p>晚上的新宿，霓虹灯把天空照亮。去了都厅展望台（免费！），45楼俯瞰整个东京的夜景，东京塔和晴空塔遥遥相望。东京的夜晚比白天更有魅力。</p>`,
  },
  {
    title: '成都美食之旅——三天吃遍锦官城',
    destination: '成都',
    tags: ['四川', '美食', '火锅', '熊猫'],
    views: 638,
    content: `<h2>Day 1：火锅之夜</h2><p>到成都的第一顿，必须是火锅！选了玉林路的一家老火锅店，红油翻滚，毛肚七上八下，嫩牛肉入口即化。辣到流汗但还是停不下筷子，这就是成都火锅的魅力。</p><p>配上冰粉和红糖糍粑解辣，完美收尾。成都的朋友说"没有一顿火锅解决不了的事，如果有，就两顿"。</p><h2>Day 2：逛吃逛吃</h2><p>上午去了大熊猫繁育基地，看到圆滚滚的熊猫在啃竹子，心都要化了！下午直奔锦里和宽窄巷子，三大炮、担担面、钟水饺、龙抄手……一路吃到底。</p><p>晚上去了九眼桥酒吧街，找了一家民谣酒吧，听着吉他手的成都民谣，喝着盖碗茶，这才是成都的夜。</p><h2>Day 3：人民公园</h2><p>最后一天去了人民公园，体验成都人的慢生活。鹤鸣茶社里，大爷大妈们喝着茶、搓着麻将，安逸得很。临走前又吃了一碗肥肠粉，带着满嘴的麻辣和满满的回忆离开。</p>`,
  },
  {
    weekend: {
      title: '周末逃离计划——杭州西湖边的24小时',
      destination: '杭州',
      tags: ['西湖', '杭州', '周末游', '江南'],
      views: 542,
      content: `<h2>出发</h2><p>周五下班直接坐高铁，一个小时就从上海到了杭州。住在龙井村的一家民宿，推开窗就是茶园。老板泡了一杯明前龙井，清香扑鼻。</p><h2>西湖晨跑</h2><p>周六早上六点就起床了，沿着苏堤跑步。晨雾中的西湖，三潭印月若隐若现，断桥上的行人稀少，这一刻的西湖只属于早起的人。</p><h2>灵隐寺</h2><p>上午去了灵隐寺，香火鼎盛。在大雄宝殿前许了个愿，又去飞来峰看了石刻造像。寺里的素斋味道出奇的好，推荐！</p><h2>湖滨银泰</h2><p>下午在湖滨银泰逛了一圈，然后在西湖边的星巴克坐到日落。看着夕阳把雷峰塔染成金色，觉得来杭州是对的。</p>`,
    },
  },
  // 修正下面这条
  {
    title: '周末逃离计划——杭州西湖边的24小时',
    destination: '杭州',
    tags: ['西湖', '杭州', '周末游', '江南'],
    views: 542,
    content: `<h2>出发</h2><p>周五下班直接坐高铁，一个小时就从上海到了杭州。住在龙井村的一家民宿，推开窗就是茶园。老板泡了一杯明前龙井，清香扑鼻。</p><h2>西湖晨跑</h2><p>周六早上六点就起床了，沿着苏堤跑步。晨雾中的西湖，三潭印月若隐若现，断桥上的行人稀少，这一刻的西湖只属于早起的人。</p><h2>灵隐寺</h2><p>上午去了灵隐寺，香火鼎盛。在大雄宝殿前许了个愿，又去飞来峰看了石刻造像。寺里的素斋味道出奇的好，推荐！</p><h2>湖滨银泰</h2><p>下午在湖滨银泰逛了一圈，然后在西湖边的星巴克坐到日落。看着夕阳把雷峰塔染成金色，觉得来杭州是对的。</p>`,
  },
  {
    title: '三亚海岛日记——阳光沙滩椰子鸡',
    destination: '三亚',
    tags: ['海南', '海滩', '度假', '潜水'],
    views: 890,
    content: `<h2>蜈支洲岛潜水</h2><p>来三亚的第一天就去了蜈支洲岛！海水清澈见底，珊瑚和热带鱼就在你身边游来游去。教练带我们潜到5米深，看到了海胆和一堆不知名的彩色小鱼。虽然耳朵有点疼，但这种体验一生难忘。</p><h2>亚龙湾躺平</h2><p>第二天选择了躺平模式。亚龙湾的沙滩白得像面粉，躺在沙滩椅上喝着椰子水，看着蓝天白云大海——这就是度假的正确打开方式。傍晚沿着沙滩散步，捡了几个小贝壳。</p><h2>第一市场海鲜</h2><p>晚上去了第一市场，自己买了海鲜（石斑鱼、大虾、皮皮虾、海胆），拿到旁边加工店现做。人均150元吃撑，这性价比在北上广想都不敢想！椰子鸡也一定要尝，椰汁煮出来的鸡肉嫩滑香甜。</p>`,
  },
  {
    title: '一个人的重庆——山城步道与火锅',
    destination: '重庆',
    tags: ['山城', '洪崖洞', '轻轨', '火锅'],
    views: 675,
    content: `<h2>魔幻的轻轨</h2><p>重庆的第一印象就来自于轻轨2号线——穿楼而过！李子坝站已经成为打卡圣地。坐在轻轨上俯瞰嘉陵江，这座城市的地形之魔幻，让你不禁感叹"这不是在拍科幻片吗？"</p><h2>山城步道</h2><p>下午走了一段山城步道，从上半城到下半城，楼梯多到让你怀疑人生。但沿途看到的老街、吊脚楼和江景，让每一步都值得。重庆人不胖都是有原因的——天天爬坡！</p><h2>洪崖洞夜景</h2><p>晚上的洪崖洞，金碧辉煌，像是宫崎骏动画里的场景。站在千厮门大桥上看洪崖洞全景，背后是灯火通明的渝中半岛，美到让人想哭。</p><h2>一个人的火锅</h2><p>一个人也去吃火锅了！选了防空洞里的一家老店，九宫格红汤锅底。毛肚、鸭肠、老肉片，辣到嘴巴发麻，但就是停不下来。一个人吃火锅也没那么孤单，因为火锅本身就是最好的陪伴。</p>`,
  },
  {
    title: '西北大环线——从青海湖到敦煌',
    destination: '青海',
    tags: ['青海湖', '敦煌', '自驾', '大西北'],
    views: 920,
    content: `<h2>Day 1-2：青海湖</h2><p>自驾从西宁出发，第一站青海湖。七月的青海湖，油菜花盛开，金黄色的花海和湛蓝色的湖水形成强烈对比。站在湖边，风吹过脸颊，带着咸咸的味道。这里的天很低，云很白，一切都纯净得不像话。</p><h2>Day 3-4：茶卡盐湖到敦煌</h2><p>茶卡盐湖被称为"天空之镜"，站在盐湖里拍倒影，怎么拍都好看。晚上赶到了敦煌，看到了沙漠里的日落，大漠孤烟直，长河落日圆——古人诚不欺我。</p><h2>Day 5：莫高窟</h2><p>莫高窟的壁画，跨越千年的艺术瑰宝。看着那些飞天和佛像，不禁感慨古人的智慧与虔诚。买了几个文创纪念品，飞天书签、九色鹿冰箱贴，把敦煌带回家。</p><h2>Day 6：鸣沙山月牙泉</h2><p>骑了骆驼，爬了沙丘，在月牙泉边坐了很久。沙漠中的一汪清泉，千年不涸，本身就是奇迹。这次西北之行虽然疲惫，但每一帧都值得铭记。</p>`,
  },
  {
    title: '西藏朝圣之旅——布达拉宫与大昭寺',
    destination: '拉萨',
    tags: ['西藏', '拉萨', '布达拉宫', '高原'],
    views: 1024,
    content: `<h2>抵达拉萨</h2><p>从成都飞拉萨，刚下飞机就感受到高原的清凉。第一天没敢多动，在八廓街慢慢走，适应高原。喝了甜茶馆的甜茶，吃了藏面和牦牛肉包子，味道朴实但让人难忘。</p><h2>布达拉宫</h2><p>提前预约了布达拉宫的门票。这座建在红山上的宫殿，层层叠叠，庄严神圣。里面供奉着历代达赖喇嘛的灵塔，镶满宝石和黄金，让人叹为观止。从布达拉宫俯瞰拉萨全城，感觉自己离天很近。</p><h2>大昭寺</h2><p>大昭寺门口，看到许多磕长头的信徒，额头已经磨出茧子，但眼神虔诚而坚定。这种信仰的力量让人震撼。寺内的释迦牟尼12岁等身像，是藏传佛教最珍贵的圣物。</p><h2>纳木错</h2><p>最后一天，包车去了纳木错。海拔4700米的圣湖，湖水蓝得像宝石，远处的念青唐古拉雪山倒映在湖中，美得不真实。在湖边许了个愿，希望有一天还能再来。</p>`,
  },
  {
    title: '厦门鼓浪屿——文艺青年的小确幸',
    destination: '厦门',
    tags: ['鼓浪屿', '厦门', '文艺', '海景'],
    views: 498,
    content: `<h2>鼓浪屿的一天</h2><p>坐轮渡上鼓浪屿，一下船就被红色砖墙的老别墅吸引。岛上没有机动车，只能步行。拿着手绘地图，穿梭在各种小巷里，每转一个弯都有惊喜。日光岩上俯瞰全岛，红瓦绿树碧海蓝天，美得像一幅油画。</p><h2>张三疯奶茶</h2><p>来鼓浪屿怎么能不去张三疯？一杯招牌奶茶配上一只猫（店里有好几只慵懒的猫咪），消磨了一个下午。岛上还有很多盖章的小店，买了一本盖章本，一路打卡——赵小姐的店、潘小莲酸奶、陈罐西式茶货铺……</p><h2>环岛路骑行</h2><p>傍晚回到厦门市区，在环岛路租了辆自行车。海风吹过，右手边是无边的大海，左手边是绿树成荫。骑到曾厝垵，吃了一碗沙茶面和一份海蛎煎，配上一杯烧仙草，完美收尾。厦门是一座让人想恋爱的小城。</p>`,
  },
  {
    title: '张家界仙境——阿凡达取景地的奇幻之旅',
    destination: '张家界',
    tags: ['张家界', '阿凡达', '武陵源', '天门山'],
    views: 780,
    content: `<h2>张家界国家森林公园</h2><p>一进景区，就被那些拔地而起的石英砂岩峰林震撼了。这些峰柱高耸入云，云雾缭绕的时候真的像仙境。哈利路亚山（原名南天一柱）就是电影《阿凡达》悬浮山的原型，站在它脚下仰望，光线穿过云雾，简直不似人间。</p><h2>金鞭溪徒步</h2><p>沿着金鞭溪走了5公里，溪水清澈见底，两岸的奇峰异石倒映在水中。路上遇到了几只野猴子，它们一点都不怕人，反而好奇地看着我们。空气清新得像是天然的大氧吧。</p><h2>天门山</h2><p>坐了世界上最长的索道——天门山索道，全程7.5公里，坐了将近30分钟。到了山顶，走了那条让人腿软的玻璃栈道。脚下就是万丈深渊，虽然知道玻璃很安全，但心还是怦怦跳。最后徒步走下999级台阶的天梯，膝盖抖得不行，但不虚此行！</p>`,
  },
];

const comments = [
  '太美了！看了你的游记我已经在订机票了！',
  '写得真好，我也去过这里，你的游记让我又回忆起了那段美好的时光。',
  '收藏了！下次旅行就按你的路线走。',
  '照片拍得太好了，是用的什么相机？',
  '攻略好详细，谢谢分享！',
  '一个人旅行真的很勇敢，佩服你！',
  '这个地方一直很想去，看完更想去了。',
  '好羡慕，希望有一天我也能去这里看看。',
  '美食那里看饿了哈哈！',
  '写得真好，感觉身临其境！',
  '收藏收藏，实用攻略太需要了~',
  '赞！这种慢旅行的方式太惬意了',
  '请问住宿大概多少钱一晚呀？',
  '那种自然的壮美真的只有亲眼看到才能体会',
  '哈哈你说的对，美食是旅行的一大意义！',
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomDate(daysBack) {
  const now = Date.now();
  const offset = randomInt(1, daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, MONGO_OPTIONS);
    console.log('MongoDB 已连接');

    // 清空现有数据
    await User.deleteMany({ email: /@travel\.com$/ });
    await Travel.deleteMany({});
    await Comment.deleteMany({});
    await Notification.deleteMany({});
    console.log('旧测试数据已清除');

    // 1. 创建用户
    const createdUsers = [];
    for (const u of users) {
      const user = await User.create(u);
      createdUsers.push(user);
      console.log(`  用户: ${user.username}`);
    }

    // 2. 创建游记
    const createdTravels = [];
    for (let i = 0; i < travels.length; i++) {
      const t = travels[i];
      const author = createdUsers[i % createdUsers.length];
      const travel = await Travel.create({
        ...t,
        author: author._id,
        createdAt: randomDate(60),
        gallery: [],
        likes: [],
      });
      createdTravels.push(travel);
      console.log(`  游记 "${t.title}" → by ${author.username}`);
    }

    // 3. 随机分配 views
    for (const t of createdTravels) {
      t.views = randomInt(200, 1500);
      await t.save();
    }

    // 4. 互相点赞
    console.log('\n生成点赞数据...');
    for (const t of createdTravels) {
      const likers = randomPick(createdUsers, randomInt(3, createdUsers.length));
      t.likes = likers.map(u => u._id);
      await t.save();

      for (const liker of likers) {
        if (liker._id.toString() !== t.author.toString()) {
          await Notification.create({
            recipient: t.author,
            sender: liker._id,
            type: 'like',
            travel: t._id,
            read: Math.random() > 0.5,
            createdAt: randomDate(30),
          });
        }
      }
    }
    console.log(`  共 ${createdTravels.reduce((sum, t) => sum + t.likes.length, 0)} 条点赞`);

    // 5. 创建评论
    console.log('\n生成评论数据...');
    let commentCount = 0;
    for (const t of createdTravels) {
      const commenters = randomPick(createdUsers, randomInt(2, 5));
      for (const commenter of commenters) {
        if (commenter._id.toString() === t.author.toString()) continue;
        const comment = await Comment.create({
          travel: t._id,
          author: commenter._id,
          content: randomPick(comments, 1)[0],
          createdAt: randomDate(25),
        });
        commentCount++;

        // 给游记作者发评论通知
        await Notification.create({
          recipient: t.author,
          sender: commenter._id,
          type: 'comment',
          travel: t._id,
          read: Math.random() > 0.5,
          createdAt: comment.createdAt,
        });

        // 随机给评论点赞
        const commentLikers = randomPick(createdUsers, randomInt(1, 4));
        comment.likes = commentLikers.map(u => u._id);
        await comment.save();
      }
    }
    console.log(`  共 ${commentCount} 条评论`);

    // 6. 随机收藏
    console.log('\n生成收藏数据...');
    for (const u of createdUsers) {
      const favTravels = randomPick(createdTravels, randomInt(2, 5));
      u.favorites = favTravels.map(t => t._id);
      await u.save();
    }
    console.log(`  收藏关系已生成`);

    // 通知统计
    const notifCount = await Notification.countDocuments();
    console.log(`  共 ${notifCount} 条通知`);

    console.log('\n✅ 种子数据生成完毕！');
    process.exit(0);
  } catch (err) {
    console.error('❌ 种子数据生成失败：', err);
    process.exit(1);
  }
}

seed();
// AI 生成结束
