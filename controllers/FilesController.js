import { v4 as uuidv4 } from 'uuid';
import { ObjectID } from 'mongodb';
import fs from 'fs';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      const users = dbClient.db.collection('users');
      const idObject = new ObjectID(userId);

      users.findOne({ _id: idObject }, (err, user) => {
        if (user) {
          const { name } = req.body;
          const { type } = req.body;
          const parentId = req.body.parentId || 0;
          const isPublic = req.body.isPublic || false;
          const { data } = req.body;

          if (!name) res.status(400).json({ error: 'Missing name' });
          if (!type || !(['folder', 'file', 'image'].includes(type))) res.status(400).json({ error: 'Missing type' });
          if (!data && type !== 'folder') res.status(400).json({ error: 'Missing data' });
          const files = dbClient.db.collection('files');
          if (parentId) {
            const parentIdObject = new ObjectID(parentId);
            files.findOne({ _id: parentIdObject }, (file) => {
              if (!file) {
                res.status(400).json({ error: 'Parent not found' });
                return;
              }
              if (file.type !== 'folder') {
                res.status(400).json({ error: 'Parent is not a folder' });
              }
            });
          }

          if (type === 'folder') {
            files.insertOne({
              userId: user._id,
              name,
              type,
              parentId: parentId || 0,
              isPublic,
            }).then((result) => {
              res.status(201).json({
                id: result.insertedId,
                userId: user._id,
                name,
                type,
                isPublic,
                parentId,
              }).catch((error) => {
                console.log(error);
              });
            });
          } else {
            const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
            const fileName = `${filePath}/${uuidv4()}`;
            const fileData = Buffer.from(data, 'base64').toString('utf-8');
            fs.mkdir(filePath, (error) => {
              if (error) console.log(error);
            });
            fs.writeFile(fileName, fileData, 'utf-8', (error) => {
              if (error) console.log(error);
            });
            files.insertOne(({
              userId: user._id,
              name,
              type,
              isPublic,
              localPath: fileName,
              parentId,
            })).then((result) => {
              res.status(201).json({
                id: result.insertedId,
                userId: user._id,
                name,
                type,
                isPublic,
                parentId,
              });
            }).catch((error) => {
              console.log(error);
            });
          }
        } else {
          res.status(401).json({ error: 'Unauthorized' });
        }
      });
    }
  }
}

module.exports = FilesController;
