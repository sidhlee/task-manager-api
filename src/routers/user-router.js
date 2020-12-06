const express = require('express')
const sharp = require('sharp')
const multer = require('multer')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendGoodbyeEmail } = require('../emails/account')

const router = new express.Router()

router.post('/', async (req, res) => {
  const user = new User(req.body)

  try {
    await user.save()

    // This returns Promise, but we don't need to wait for sendgrid to finish sending its email.
    sendWelcomeEmail(user.email, user.name)

    const token = await user.generateAuthToken()

    res.status(201).send({
      user,
      token,
    })
  } catch (err) {
    res.status(400).send(err)
  }
})

router.post('/login', async (req, res) => {
  try {
    // static function defined on userSchema.static
    const user = await User.findByCredentials(req.body.email, req.body.password)

    const token = await user.generateAuthToken()

    res.send({ user, token })
  } catch (e) {
    res.status(400).send()
  }
})

router.post('/logout', auth, async (req, res) => {
  // logout from specific device by removing the token that was sent with request in authorization header
  // auth middleware parses it to retrieve user doc
  try {
    // keep all the other tokens
    req.user.tokens = req.user.tokens.filter((t) => {
      return t.token !== req.token
    })
    await req.user.save()

    res.send()
  } catch (err) {
    console.log(err)
    res.status(500).send()
  }
})

// Wipe out all tokens
router.post('/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  } catch (err) {
    res.status(500).send()
  }
})

router.get('/me', auth, async (req, res) => {
  res.send(req.user) // this only runs when the user is authenticated
})

// Not needed anymore because we're getting individual user with auth middleware

// router.get('/:id', async (req, res) => {
//   try {
//     const user = findById(req.params.id)
//     if (!user) {
//       return res.status(404).send()
//     }
//     res.send(user)
//   } catch (err) {
//     res.status(500).send()
//   }
// })

router.patch('/me', auth, async (req, res) => {
  // field validation: mongoose just ignores any fields that aren't specified in the Schema
  const requestedUpdates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']
  const isValid = requestedUpdates.every((update) =>
    allowedUpdates.includes(update)
  )
  if (!isValid) {
    return res.status(400).send({ error: 'Invalid updates!' })
  }

  try {
    requestedUpdates.forEach((update) => (req.user[update] = req.body[update]))
    await req.user.save()
    res.send(req.user)
  } catch (err) {
    console.log(err)
    res.status(400).send(err)
  }
})

// User should only be allowed to delete their own account, so no need to provide id
router.delete('/me', auth, async (req, res) => {
  try {
    // don't need to fetch user anymore since we're doing that inside auth middleware!
    // const user = await User.findByIdAndDelete(req.user._id)
    // if (!user) {
    //   return res.status(404).send({ error: 'User not found!' })
    // }

    await req.user.remove() // now remove the document that was already fetched
    sendGoodbyeEmail(req.user.email, req.user.name)
    res.send(req.user)
  } catch (err) {
    res.status(500).send(err)
  }
})

const avatarUpload = multer({
  // dest: 'avatar', remove 'dest' field in order to access uploaded file from req.file
  limits: {
    fileSize: 500000, // 500kb
  },
  fileFilter(req, file, cb) {
    const isValid = ['image/jpg', 'image/jpeg', 'image/png'].some(
      (mt) => mt === file.mimetype
    )
    if (!isValid) {
      cb(new Error('Image file must be either jpg, jpeg, or png.'))
    }
    cb(undefined, isValid)
  },
})

router.post(
  '/me/avatar',
  auth, // must be authenticated to be able to upload!
  avatarUpload.single('avatar'),
  async (req, res) => {
    // to access file buffer, you should not have 'dest' field in multer option
    // req.user.avatar = req.file.buffer // this is a binary file
    // <img src="data:image/jpg;base64;...imageBinary..." > would render image binary onto browser

    const buffer = await sharp(req.file.buffer)
      .resize({
        width: 250,
        height: 250,
      })
      .png()
      .toBuffer()

    req.user.avatar = buffer

    await req.user.save()
    res.send()
  },
  (err, req, res, next) => {
    // pass 4 args to make it error handler
    res.status(400).send({ error: err.message })
  }
)

router.delete('/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined
  await req.user.save()
  res.send()
})

/**
 * Send avatar image bin file by user id
 */
router.get('/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user || !user.avatar) {
      throw new Error() // we're only sending back the status code
    }

    res.set('Content-Type', 'image/png') // sharp allows us to set uniform type for returning content
    res.send(user.avatar)
  } catch (err) {
    send.status(404).send()
  }
})

module.exports = router
