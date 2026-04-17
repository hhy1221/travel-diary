const mongoose = require('mongoose');
const name = process.argv[2];
const color = process.argv[3];
console.log("Trying to update " + name + " ...");
update(name, color);

async function update() {
    const update_name = arguments[0];
    const update_color = arguments[1];
    
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

    let kitty = await kitten.findOne({ name: update_name });
    if (kitty != null) {
        kitty.color = update_color;
        await kitty.save();
        console.log("Update success:");
        console.log(kitty);
    } else {
        console.log(update_name + " not exist");
    }

    mongoose.connection.close();
}
