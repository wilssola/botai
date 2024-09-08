import {Document, MongoClient} from "mongodb";
import {AuthenticationCreds, AuthenticationState, SignalDataSet, SignalDataTypeMap,} from "baileys/lib/Types";
import {initAuthCreds} from "baileys/lib/Utils/auth-utils";
import {BufferJSON} from "baileys/lib/Utils/generics";
import {WAProto} from "baileys/lib/Types/Message";

/**
 * Configuration object for MongoDB authentication.
 *
 * @param {string} databaseName - The name of the MongoDB database.
 * @param {string} collectionName - The name of the MongoDB collection.
 * @param {string} sessionId - The name of the Instance that you want to give to identify the connection, allowing multi-sessions in MongoDB.
 */
type MongoDBAuthConfig = {
  databaseName: string;
  collectionName: string;
  sessionId: string;
};

// Create a new MongoClient instance with the provided URI and options
const client = new MongoClient(process.env.MONGO_URI!, {
  connectTimeoutMS: 15000,
  retryWrites: true,
});

// Connect to the MongoDB client
await client.connect();

/**
 * Creates and returns an authentication object that stores and reads data in MongoDB.
 *
 * @see https://github.com/WhiskeySockets/Baileys/blob/a13cad89d2dcfe5ff1e91ab4aaedf63a248b466f/src/Utils/use-mongodb-auth-state.ts
 * @param {MongoDBAuthConfig} config - The MongoDB authentication configuration.
 * @returns {Promise<{ state: AuthenticationState; saveCreds: () => Promise<void>; removeCreds: () => Promise<void> }>} The authentication object.
 */
export const mongodbAuthState = async (
  config: MongoDBAuthConfig
): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  removeCreds: () => Promise<void>;
}> => {
  const sessionId = config.sessionId;
  const db = client.db(config.databaseName);
  const collection = db.collection(config.collectionName);

  /**
   * Ensures that the collection exists.
   *
   * @private
   */
  const ensureCollectionExists = async () => {
    const collections = await db
      .listCollections({ name: config.collectionName })
      .toArray();
    if (collections.length === 0) {
      await db.createCollection(config.collectionName);
    }
  };

  await ensureCollectionExists();

  /**
   * Writes data to the collection.
   *
   * @param {unknown} data - The data to write.
   * @param {string} key - The key of the document.
   * @private
   */
  async function writeData(data: unknown, key: string) {
    await collection.replaceOne(
      { _id: key } as Document,
      JSON.parse(JSON.stringify(data, BufferJSON.replacer)),
      { upsert: true }
    );
  }

  /**
   * Reads data from the collection.
   *
   * @param {string} key - The key of the document.
   * @returns {Promise<unknown>} The data from the collection.
   * @private
   */
  async function readData(key: string) {
    const data = await collection.findOne({ _id: key } as Document);
    const creds = JSON.stringify(data);
    return JSON.parse(creds, BufferJSON.reviver);
  }

  /**
   * Removes data from the collection.
   *
   * @param {string} key - The key of the document.
   * @private
   */
  const removeData = async (key: string) => {
    await collection.deleteOne({ _id: key } as Document);
  };

  // Initialize authentication credentials
  const creds: AuthenticationCreds =
    (await readData(`creds-${sessionId}`)) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        /**
         * Retrieves keys from the collection.
         *
         * @param {string} type - The type of the key.
         * @param {string[]} ids - The IDs of the keys.
         * @returns {Promise<{ [_: string]: SignalDataTypeMap[typeof type] }>} The retrieved keys.
         */
        get: async (type, ids) => {
          const data: { [_: string]: SignalDataTypeMap[typeof type] } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}-${sessionId}`);
              if (type === "app-state-sync-key" && value) {
                value = WAProto.Message.AppStateSyncKeyData.fromObject(value);
              }

              data[id] = value;
            })
          );

          return data;
        },
        /**
         * Sets keys in the collection.
         *
         * @param {SignalDataSet} data - The data to set.
         * @returns {Promise<void>}
         */
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
    /**
     * Saves the credentials to the collection.
     *
     * @returns {Promise<void>}
     */
    saveCreds: async () => {
      await writeData(creds, `creds-${sessionId}`);
    },
    /**
     * Removes the credentials from the collection.
     *
     * @returns {Promise<void>}
     */
    removeCreds: async () => {
      await removeData(`creds-${sessionId}`);
    },
  };
};
