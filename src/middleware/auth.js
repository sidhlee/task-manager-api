const jwt = require('jsonwebtoken')
const User = require('../models/user')

// This middleware is going to be attached onto the routes that require authorization (so not to login & signup)
// and will be inserted before the controllers
/**
 * Parse user id from token inside authorization header, fetch the user with id, then attach user to req object.
 */
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET) // throw an Error if not verified

    // In addition to _id, we'll also check if the token matches the one from the database.
    // We need string as the property key when it includes special character.
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

    if (!user) {
      throw new Error() // enough to trigger catch below
    }

    req.token = token
    req.user = user // to save redundant user-fetching from the following controller

    return next()
  } catch (err) {
    return res.status(401).send({ error: 'Please authenticate.' })
  }
}

module.exports = auth
