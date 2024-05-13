import { v4 as uuidv4 } from 'uuid';
import { ObjectID } from 'mongodb';
import fs from 'fs';
import dbClient from '../utils/db';
import getUser from '../utils/getUser';

class FilesController {
  static async postUpload(req, res) {
    const user = await getUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !(['folder', 'file', 'image'].includes(type))) return res.status(400).json({ error: 'Missing type' });
    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    const files = await dbClient.db.collection('files');

    if (parentId) {
      const parentIdObject = new ObjectID(parentId);
      const file = await files.findOne({ _id: parentIdObject });
      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    if (type === 'folder') {
      await files.insertOne(
        {
          userId: user._id, name, type, parentId, isPublic,
        },
      ).then((result) => {
        res.status(201).json(
          {
            id: result.insertedId, userId: user._id, name, type, isPublic, parentId,
          },
        );
      }).catch((error) => {
        console.log(error);
      });
    } else {
      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileName = `${filePath}/${uuidv4()}`;
      const fileData = Buffer.from(data, 'base64').toString('utf-8');
      await fs.mkdir(filePath, () => {});
      await fs.writeFile(fileName, fileData, 'utf-8', (error) => {
        if (error) console.log(error);
      });

      await files.insertOne(
        {
          userId: user._id, name, type, isPublic, localPath: fileName, parentId,
        },
      ).then((result) => res.status(201).json(
        {
          id: result.insertedId, userId: user._id, name, type, isPublic, parentId,
        },
      )).catch((error) => console.log(error));
    }
    return null;
  }
}

module.exports = FilesController;
