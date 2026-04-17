const mongoose = require('mongoose');
const name = process.argv[2];
const MONGO_USER = 'qgh';  
const MONGO_PWD = 'qgh15690080082'; 
const MONGO_URI = `mongodb://${MONGO_USER}:${MONGO_PWD}@127.0.0.1:27017/third?authSource=admin`;
async function read() {
    const find_name = arguments[0];
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ 连接成功');
        const kittenSchema = new mongoose.Schema({
            name: String,
            color: String
        });
        const kitten = mongoose.model('kitten', kittenSchema);
        let query = {};
        if (find_name) {
            query = { name: find_name };
        }
        const kitty = await kitten.find(query);
        console.log('查询结果:', kitty);
    } catch (err) {
        console.error('失败:', err.message);
    } finally {
        await mongoose.connection.close();
        console.log('连接已关闭');
    }
}
read(name);