const mongoose = require('mongoose');
const name = process.argv[2];
const color = process.argv[3];
console.log("save " + name + " ...");
update(name, color);

async function update() {
    const update_name = arguments[0];
    const update_color = arguments[1];

   
    await mongoose.connect('mongodb://olivila:13768157050@localhost:27017/first?authSource=admin');

    const kittenSchema = new mongoose.Schema({
        name: String,
        color: String
    });

    const kitten = mongoose.model('kitten', kittenSchema);

   
    let kitty = await kitten.findOne({ name: update_name });
    if (kitty == null) {
        console.log(update_name + " not found!");
    } else {
        
        kitty.color = update_color;
        await kitty.save();
        console.log("update success:");
        console.log(kitty);
    }

    await mongoose.connection.close();
}