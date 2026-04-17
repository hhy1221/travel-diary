const mongoose = require('mongoose');
const name = process.argv[2];
const color = process.argv[3];
const MONGO_USER = 'qgh';  
const MONGO_PWD = 'qgh15690080082'; 
const MONGO_URI = `mongodb://${MONGO_USER}:${MONGO_PWD}@127.0.0.1:27017/third?authSource=admin`;
update(name, color);
async function update() {
    const update_name = arguments[0];
    const update_color = arguments[1];
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ 连接成功');
        const kittenSchema = new mongoose.Schema({
            name: String,
            color: String
        });
        const kitten = mongoose.model('kitten', kittenSchema);
        let kitty = await kitten.findOne({ name: update_name });
        if (kitty != null) {
            kitty.color = update_color;
            await kitty.save();
            console.log("update:");
            console.log(kitty);
        } else {
            console.log(update_name + " not exist");
        }
    } catch (err) {
        console.error('❌ 失败:', err.message);
    } finally {
        await mongoose.connection.close();
        console.log('连接已关闭');
    }
}