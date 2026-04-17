const mongoose = require('mongoose');
const name = process.argv[2];
read(name);

async function read() {
    const find_name = arguments[0];
    
    
    await mongoose.connect('mongodb://olivila:13768157050@localhost:27017/first?authSource=admin');

    const kittenSchema = new mongoose.Schema({
        name: String,
        color: String
    });

    const kitten = mongoose.model('kitten', kittenSchema);

    
    let kitty = await kitten.findOne({ name: find_name });
    if (kitty == null) {
        console.log(find_name + " not found!");
    } else {
        console.log("find success:");
        console.log(kitty);
    }

    await mongoose.connection.close();
}