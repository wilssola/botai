import {Document, MongoClient} from "mongodb";
import {AuthenticationCreds, AuthenticationState, SignalDataSet, SignalDataTypeMap,} from "baileys/lib/Types";
import {initAuthCreds} from "baileys/lib/Utils/auth-utils";
import {BufferJSON} from "baileys/lib/Utils/generics";
import WAProto from "baileys/WAProto";

/**
 * Configuration object for MongoDB authentication.
 *
 * @param {string} mongodbUri - The MongoDB connection URI.
 * @param {string} databaseName - The name of the MongoDB database.
 * @param {string} collectionName - The name of the MongoDB collection.
 * @param {string} sessionId - The name of the Instance that you want to give to identify the connection, allowing multi-sessions in MongoDB.
 */
type MongoDBAuthConfig = {
  mongodbUri: string;
  databaseName: string;
  collectionName: string;
  sessionId: string;
};

/**
 * Creates and returns an authentication object that stores and reads data in MongoDB.
 *
 * @see https://github.com/WhiskeySockets/Baileys/blob/a13cad89d2dcfe5ff1e91ab4aaedf63a248b466f/src/Utils/use-mongodb-auth-state.ts
 * @param {MongoDBAuthConfig} config - The MongoDB authentication configuration.
 * @returns {Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }>} The authentication object.
 */
export const useMongoDBAuthState = async (
  config: MongoDBAuthConfig
): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> => {
  const client = new MongoClient(config.mongodbUri, {
    connectTimeoutMS: 15000,
  });

  const sessionId = config.sessionId;
  await client.connect();
  const db = client.db(config.databaseName);
  const collection = db.collection(config.collectionName);

  const ensureCollectionExists = async () => {
    const collections = await db
      .listCollections({ name: config.collectionName })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection(config.collectionName);
    }
  };

  await ensureCollectionExists();

  async function writeData(data: unknown, key: string) {
    await collection.replaceOne(
      { _id: key } as Document,
      JSON.parse(JSON.stringify(data, BufferJSON.replacer)),
      { upsert: true }
    );
  }

  async function readData(key: string) {
    const data = await collection.findOne({ _id: key } as Document);
    const creds = JSON.stringify(data);
    return JSON.parse(creds, BufferJSON.reviver);
  }

  const removeData = async (key: string) => {
    await collection.deleteOne({ _id: key } as Document);
  };

  const creds: AuthenticationCreds =
    (await readData(`creds-${sessionId}`)) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [_: string]: SignalDataTypeMap[typeof type] } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}-${sessionId}`);
              if (type === "app-state-sync-key" && value) {
                value =
                  WAProto.proto.Message.AppStateSyncKeyData.fromObject(value);
              }

              data[id] = value;
            })
          );

          return data;
        },
        set: async (data) => {
          const tasks: Promise<void>[] = [];

          for (const category in data) {
            for (const id in data[category as keyof SignalDataSet]) {
              const value = data[category as keyof SignalDataSet]![id];

              const key = `${category}-${id}-${sessionId}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }

          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      await writeData(creds, `creds-${sessionId}`);
    },
  };
};
