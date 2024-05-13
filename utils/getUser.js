import { ObjectID } from 'mongodb';
import dbClient from './db';
import redisClient from './redis';

async function getUser(req) {
  const token = req.headers['x-token'];
  if (!token) {
    return null;
  }
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    return null;
  }
  const users = await dbClient.db.collection('users');
  const idObject = new ObjectID(userId);

  const user = await users.findOne({ _id: idObject });
  if (!user) {
    return null;
  }
  return user;
}

module.exports = getUser;
