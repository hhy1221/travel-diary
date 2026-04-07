const express = require('express')
const app = express()

app.use(express.static('public'));

app.set('view engine', 'ejs')

app.get('/', (req,res) => {
  res.render('hello', { dynamic_text: '新加入的动态内容' })
})

app.listen(12399)