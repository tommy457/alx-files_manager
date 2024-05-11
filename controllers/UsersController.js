import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static postNew(req, res) {
    const { email } = req.body;
    const { password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
    }

    const users = dbClient.db.collection('users');
    users.findOne({ email }, (err, data) => {
      if (data) {
        res.status(400).json({ error: 'Already exist' });
      } else {
        const hashedPassword = sha1(password);
        users.insertOne({
          email,
          password: hashedPassword,
        }).then((user) => {
          res.status(201).json({ id: user.insertedId, email });
        }).catch((err) => {
          console.log(`Error while creating the user: ${err}`);
        });
      }
    });
  }
}

module.exports = UsersController;
