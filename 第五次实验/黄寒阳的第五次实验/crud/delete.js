const mongoose = require('mongoose');
const name = process.argv[2];
del(name);

async function del() {
    const delete_name = arguments[0];
    
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

    await kitten.deleteMany({ name: delete_name });
    
    console.log("delete " + delete_name + " success");

    mongoose.connection.close();
}