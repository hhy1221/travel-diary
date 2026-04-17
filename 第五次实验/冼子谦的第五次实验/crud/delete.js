const mongoose = require('mongoose');
 const name = process.argv[2]; // 获取命令行传入的要删除的名字
 del(name);
 async function del() {
     const delete_name = arguments[0];
     
     await mongoose.connect('mongodb://olivila:13768157050@localhost:27017/first?authSource=admin');
     const kittenSchema = new mongoose.Schema({
         name: String,
         color: String
     });
     const kitten = mongoose.model('kitten', kittenSchema);
  
     const result = await kitten.deleteOne({ name: delete_name });
     if (result.deletedCount > 0) {
         console.log("删除成功：已删除 '" + delete_name + "' 的数据。");
     } else {
         console.log("删除失败：未找到名为 '" + delete_name + "' 的数据。");
     }
     
     await mongoose.connection.close();
 }