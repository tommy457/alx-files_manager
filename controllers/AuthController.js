import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import getUser from '../utils/getUser';

class AuthController {
  static async getConnect(req, res) {
    const authData = req.headers.authorization.slice(6);
    const UserData = Buffer.from(authData, 'base64').toString('utf-8');
    const userEmail = UserData.split(':')[0];
    const hashedPassword = sha1(UserData.split(':')[1]);

    const users = await dbClient.db.collection('users');

    const user = await users.findOne({ email: userEmail, password: hashedPassword });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const user = await getUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await redisClient.del(`auth_${token}`);
    return res.status(204).json({});
  }
}

module.exports = AuthController;
