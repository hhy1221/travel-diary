const mongoose = require('mongoose');
const name = process.argv[2];
const color = process.argv[3];
create(name, color);

async function create() {
    const new_name = arguments[0];
    const new_color = arguments[1];
    await mongoose.connect('mongodb://olivila:13768157050@localhost:27017/first?authSource=admin');

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
        console.log(name + " already exist:");
        console.log(kitty);
    }

    await mongoose.connection.close();
}