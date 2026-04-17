const mongoose = require('mongoose');
read();

async function read() {
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

    const kitty = await kitten.find();
    console.log("All kittens in database:");
    console.log(kitty);

    mongoose.connection.close();
}