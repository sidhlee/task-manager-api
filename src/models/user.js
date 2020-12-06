const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true, // must restart the mongod to take effect
      required: true,
      trim: true,
      lowercase: true,
      validate(val) {
        if (!validator.isEmail(val)) {
          throw new Error('Email is invalid')
        }
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      default: 0,
      validate(val) {
        if (val < 0) {
          throw new Error('Age must be a positive number')
        }
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6, // NOT minLength!
      trim: true,
      validate(val) {
        if (val.toLowerCase().includes('password')) {
          throw new Error('Password cannot contain "password"')
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true, // false by default - add "createdAt" & "updatedAt" timestamps
  }
)

// virtual properties are NOT saved into database
userSchema.virtual('tasks', {
  ref: 'Task', // reference Task as the"foreign" Model
  localField: '_id', // looks for '_id' field in User model documents,
  foreignField: 'owner', //  and match its value to 'owner' field of Task model documents
})

userSchema.methods.generateAuthToken = async function () {
  // We store instance methods under Schema.methods
  // because we're accessing instances, we're using regular function expression
  const user = this // for readability
  const token = jwt.sign({ _id: user._id.toString() }, 'thisismydirtysecret')

  // save new token to the database
  user.tokens = user.tokens.concat({ token })
  await user.save()

  return token
}

// The return value of this method is used in calls to JSON.stringify(doc).(i.e. when user is sent with response)
// https://mongoosejs.com/docs/api.html#document_Document-toJSON
userSchema.methods.toJSON = function () {
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  delete userObject.tokens
  delete userObject.avatar // avatar holds large data buffer and sending this every time will slow things down a lot.

  return userObject // user document will be stringified into this object (plain with password and tokens field deleted) when being sent inside respond body
}

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email })
  // generic error message to avoid giving too much information on user account
  const message = 'unable to login'

  if (!user) {
    throw new Error(message)
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    throw new Error(message)
  }

  return user
}

// Hash user password before save
userSchema.pre('save', async function (next) {
  // can't use arrow function because of 'this'
  const user = this // for readability

  // Hash only If the document is newly created OR the 'password' field is updated
  // => prevents double hashing when saving updated document
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }

  next()
})

// Delete user tasks when user is removed
// - We should always do cascading removal inside hooks(middleware) instead of controllers
//  because regardless of where you delete the one side, related many side should also be deleted.
userSchema.pre('remove', async function (next) {
  const user = this

  await Task.deleteMany({ owner: user._id })

  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
