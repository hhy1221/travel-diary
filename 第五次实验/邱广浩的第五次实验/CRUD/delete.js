const mongoose = require('mongoose');
const name = process.argv[2];
const MONGO_USER = 'qgh';
const MONGO_PWD = 'qgh15690080082';
const MONGO_URI = `mongodb://${MONGO_USER}:${MONGO_PWD}@127.0.0.1:27017/third?authSource=admin`;

del(name);

async function del() {
    const delete_name = arguments[0];
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ 连接成功');
        
        const kittenSchema = new mongoose.Schema({
            name: String,
            color: String
        });

        const Kitten = mongoose.model('kitten', kittenSchema);
        
        await Kitten.deleteMany({ name: delete_name });
        
        console.log("delete " + delete_name);
    } catch (err) {
        console.error('❌ 失败:', err.message);
    } finally {
        await mongoose.connection.close();
        console.log('连接已关闭');
    }
}