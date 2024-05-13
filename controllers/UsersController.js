import sha1 from 'sha1';
import dbClient from '../utils/db';
import getUser from '../utils/getUser';

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

    const user = await getUser(req);
    if (user) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }
    const users = await dbClient.db.collection('users');

    const hashedPassword = sha1(password);
    await users.insertOne({
      email,
      password: hashedPassword,
    }).then((user) => res.status(201).json({ id: user.insertedId, email })).catch((err) => {
      console.log(err);
    });
  }

  static async getMe(req, res) {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    return res.status(200).json({ id: user._id, email: user.email });
  }
}

module.exports = UsersController;
