const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user-router')
const taskRouter = require('./routers/task-router')

const app = express()
const port = process.env.PORT || 5000 // for Heroku

app.use(express.json()) // parse incoming json
app.use('/users', userRouter)
app.use('/tasks', taskRouter)

app.listen(port, () => {
  console.log('Server is up on port ' + port)
})
