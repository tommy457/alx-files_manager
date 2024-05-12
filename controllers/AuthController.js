import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authData = req.headers.authorization.slice(6);
    const UserData = Buffer.from(authData, 'base64').toString('utf-8');
    const userEmail = UserData.split(':')[0];
    const hashedPassword = sha1(UserData.split(':')[1]);

    const users = dbClient.db.collection('users');

    users.findOne({ email: userEmail, password: hashedPassword }, async (err, user) => {
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        const token = uuidv4();
        await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);
        res.status(200).json({ token });
      }
    });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await redisClient.del(`auth_${token}`);
    res.status(204).json({});
  }
}

module.exports = AuthController;
