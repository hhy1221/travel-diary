const mongoose = require('mongoose');
const fs = require('fs');

const MONGO_URI = 'mongodb://huanghanyang:S20061221hhy@127.0.0.1:27017/travel?authSource=admin';

function toObjectId(obj) {
  if (!obj) return obj;
  if (typeof obj === 'string' && obj.length === 24 && /^[0-9a-f]+$/i.test(obj)) {
    return new mongoose.Types.ObjectId(obj);
  }
  return obj;
}

async function run() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const data = JSON.parse(fs.readFileSync('/home/ubuntu/data.json', 'utf8'));

  await db.dropDatabase();
  console.log('旧数据已清除');

  const collections = ['users', 'travels', 'comments', 'notifications', 'settings'];
  for (const col of collections) {
    if (data[col] && data[col].length > 0) {
      const docs = JSON.parse(JSON.stringify(data[col]));
      for (const doc of docs) {
        if (doc._id) doc._id = toObjectId(doc._id);
        for (const key of Object.keys(doc)) {
          const v = doc[key];
          if (v && typeof v === 'string' && v.length === 24 && /^[0-9a-f]+$/i.test(v)) {
            // 跳过明显不是 ID 的字段（email、content、title等长的也可能是24位字符串）
            if (key === 'author' || key === 'travel' || key === '_id') {
              doc[key] = toObjectId(v);
            }
          }
          if (Array.isArray(v)) {
            doc[key] = v.map(item => toObjectId(item));
          }
        }
      }
      await db.collection(col).insertMany(docs);
      console.log(col + ': ' + docs.length + ' 条');
    }
  }

  console.log('✅ 导入完成！');
  await mongoose.disconnect();
}

run().catch(err => { console.error('❌ 失败:', err.message); process.exit(1); });
