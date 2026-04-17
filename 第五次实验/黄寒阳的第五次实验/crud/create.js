const mongoose = require('mongoose');
const name = process.argv[2];
const color = process.argv[3];
create(name, color);

async function create() {
    const new_name = arguments[0];
    const new_color = arguments[1];
    
    // ----- 已为你修改好的连接地址 -----
    await mongoose.connect('mongodb://127.0.0.1:27017/third', {
        auth: { username: 'huanghanyang', password: 'S20061221hhy' },
        authSource: 'admin'
    });
    // ---------------------------------

    const kittenSchema = new mongoose.Schema({
        name: String,
        color: String
    });

    const kitten = mongoose.model('kitten', kittenSchema);

    let kitty = await kitten.findOne({ name: new_name });
    if (kitty == null) {
        kitty = new kitten({ name: new_name, color: new_color });
        await kitty.save();
        console.log("add:");
        console.log(kitty);
    } else {
        console.log(new_name + " already exist:");
        console.log(kitty);
    }

    mongoose.connection.close();
}