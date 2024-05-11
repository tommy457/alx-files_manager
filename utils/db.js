import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '27017';
    const dbName = process.env.DB_DATABASE || 'files_manager';

    const uri = `mongodb://${dbHost}:${dbPort}/${dbName}`;

    this.isConnected = false;

    this.client = new MongoClient(uri, { useUnifiedTopology: true, useNewUrlParser: true });
    this.client.connect().then(() => {
      this.db = this.client.db(dbName);
      this.isConnected = true;
    }).catch((err) => {
      console.log(err);
    });
  }

  isAlive() {
    return this.isConnected;
  }

  async nbUsers() {
    const count = this.db.collection('users').countDocuments();
    return count;
  }

  async nbFiles() {
    const count = this.db.collection('files').countDocuments();
    return count;
  }
}

const dbClient = new DBClient();

module.exports = dbClient;
