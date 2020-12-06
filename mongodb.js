const { MongoClient, ObjectID } = require('mongodb');

const MONGO_URI = 'mongodb://127.0.0.1:27017'; // using 'localhost' instead of ip is known to causing some problems...
const dbName = 'task-manager';

MongoClient.connect(
  MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (error, client) => {
    if (error) {
      return console.log('Unable to connect to database!', error);
    }

    console.log('Connected correctly!');

    const db = client.db(dbName); // return db instance for the given name

    // db.collection('users')
    //   .deleteMany({
    //     age: {
    //       $lt: 20,
    //     },
    //   })
    //   .then((result) => console.log(result))
    //   .catch((err) => console.log(err));

    db.collection('tasks')
      .deleteOne({
        description: {
          $regex: /job/,
          $options: 'i',
        },
      })
      .then((result) => console.log(result))
      .catch((err) => console.log(err));
  }
);
