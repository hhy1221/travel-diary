const express = require('express')
const app = express()

app.use(express.static('public')); 
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.get('/ejs', (req, res) => {
  res.render('hello', {
    dynamic_text: '新加入的动态内容',
    blog_name: '个人博客系统'
  });
})
app.get('/', (req,res) => {
  console.log("GET:")
  console.log(req.query.title)
  console.log(req.query.description)
  res.render('hello', { 
    dynamic_text: '正在处理GET数据......',
    blog_name: '个人博客系统'
  })
})
app.post('/', (req,res) => {
  let data = {}
  data.title = req.body.title
  data.description = req.body.description
  res.render('display', { article: data })
})
app.listen(12399, () => {
  console.log('服务器启动成功')
  console.log('访问地址:http://localhost:12399')
})