const express = require('express')
const app = express()

app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.render('hello', { dynamic_text: '请在下面的空白处输入内容...' })
})

app.post('/', (req, res) => {
  const article = {
    title: req.body.title,
    description: req.body.description
  }
  res.render('display', { article: article })
})

app.listen(4000, () => {
  console.log('Server is running at http://localhost:4000')
})
