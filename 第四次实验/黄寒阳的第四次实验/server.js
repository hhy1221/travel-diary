const express = require('express')
const app = express()

app.listen(12399, () => {
    console.log('服务器运行在 http://localhost:12399')
})

app.use(express.static('public'));

app.set('view engine', 'ejs')


app.get('/hello', (req, res) => {
    res.render('hello', { dynamic_text: '欢迎光临黄寒阳的小站！' })
})

app.get('/', (req, res) => {
    res.render('hello', { dynamic_text: '这是首页，很高兴遇见你！' })
})

app.use(express.urlencoded({ extended: false }))

app.post('/submit', (req, res) => {
    let data = {
        title: req.body.title,
        description: req.body.description
    }
    res.render('display', { article: data })
})