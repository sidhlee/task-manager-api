const mongoose = require('mongoose')

// With mongo driver, we created db instance to access collections after we establish connection.
// mongoose is imported as singleton and creates a default connection with the specified database here.
// then we create model instances to access and do CRUD ops on collections.
// for multiple connections to different db, read https://mongoosejs.com/docs/connections.html#multiple_connections
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true, // for quicker access,
  useFindAndModify: false,
})
