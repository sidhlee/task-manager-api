const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router()

router.post('/', auth, async (req, res) => {
  const task = new Task({
    ...req.body, // client only provides description and completed field
    owner: req.user._id, // and server adds owner field from the parsed token
  })

  try {
    await task.save()
    res.status(201).send(task)
  } catch (err) {
    res.status(400).send(err)
  }
})

// GET /tasks?completed=false
// GET /tasks?limit=10&skip=0
// GET /tasks?sortBy=createdAt_desc (_, : or any special character works as delimiter)
router.get('/', auth, async (req, res) => {
  // get query strings
  const { completed, limit, skip, sortBy } = req.query

  // Create a match object to pass onto populate.options
  const match = {}
  if (completed) {
    match.completed = completed === 'true' // You need to convert the query "string"
  }

  // Create a sort object to pass onto populate.options
  const sort = {}
  if (sortBy) {
    const [by, order] = req.query.sortBy.split('_')
    sort[by] = order === 'desc' ? -1 : 1
  }

  if (sortBy)
    try {
      // const tasks = await Task.find({ owner: req.user._id })
      await req.user
        .populate({
          path: 'tasks',
          match, // filter populating documents
          options: {
            // limit, skip & sort goes into 'options'
            limit: parseInt(limit),
            skip: parseInt(skip),
            sort,
          },
        })
        .execPopulate()

      res.send(req.user.tasks)
    } catch (err) {
      console.log(err)
      res.status(500).send()
    }
})

router.get('/:id', auth, async (req, res) => {
  try {
    // const task = await Task.findById(req.params.id)
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id, // check if the returned task is owned by current token holder
    })
    if (!task) {
      return res.status(404).send() // no need to give back too much information
    }
    res.send(task)
  } catch (err) {
    res.status(500).send()
  }
})

router.patch('/:id', auth, async (req, res) => {
  const allowedUpdates = ['description', 'completed']
  const updates = Object.keys(req.body)
  const isValid = updates.every((u) => allowedUpdates.includes(u))
  if (!isValid) {
    return res.status(400).send({ error: 'Invalid updates!' })
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    })
    if (!task) return res.status(404).send()
    updates.forEach((update) => (task[update] = req.body[update]))
    await task.save()

    res.send(task)
  } catch (err) {
    res.status(400).send(err)
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    // check if the task is indeed owned by the user by matching user-id from token
    // with the user-id under owner field from task document.
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
    if (!task) {
      return res.status(404).send({ error: 'Task not found!' })
    }
    await task.remove()

    res.send(task)
  } catch (err) {
    res.status(500).send(err)
  }
})

module.exports = router
