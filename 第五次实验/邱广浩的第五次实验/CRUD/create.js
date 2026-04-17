const mongoose = require('mongoose');
const name = process.argv[2];
const color = process.argv[3];
const MONGO_USER = 'qgh';
const MONGO_PWD = 'qgh15690080082';
const MONGO_URI = `mongodb://${MONGO_USER}:${MONGO_PWD}@127.0.0.1:27017/third?authSource=admin`;

create(name, color);

async function create() {
    const new_name = arguments[0];
    const new_color = arguments[1];
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ 连接成功');
        
        const kittenSchema = new mongoose.Schema({
            name: String,
            color: String
        });

        const Kitten = mongoose.model('kitten', kittenSchema);

        let kitty = await Kitten.findOne({ name: new_name });
        if (kitty == null) {
            kitty = new Kitten({ name: new_name, color: new_color });
            await kitty.save();
            console.log("add: " + new_name);
        } else {
            console.log(new_name + " already exist");
        }
    } catch (err) {
        console.error('❌ 失败:', err.message);
    } finally {
        await mongoose.connection.close();
        console.log('连接已关闭');
    }
}