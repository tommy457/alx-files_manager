import sha1 from 'sha1';
import { ObjectID } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email } = req.body;
    const { password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const users = dbClient.db.collection('users');
    await users.findOne({ email }, (err, data) => {
      if (data) {
        res.status(400).json({ error: 'Already exist' });
      }
    });
    const hashedPassword = sha1(password);
    await users.insertOne({
      email,
      password: hashedPassword,
    }).then((user) => {
      res.status(201).json({ id: user.insertedId, email });
    }).catch((err) => {
      console.log(err);
    });
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      const users = dbClient.db.collection('users');
      const idObject = new ObjectID(userId);

      await users.findOne({ _id: idObject }, (err, data) => {
        if (data) {
          res.status(200).json({ id: userId, email: data.email });
        } else {
          res.status(401).json({ error: 'Unauthorized' });
        }
      });
    }
  }
}

module.exports = UsersController;
