/* local mongodb replica set for development (supports change streams).
   usage: npm run db:dev   then set MONGODB_URI=mongodb://127.0.0.1:27027/bclearns?replicaSet=rs0 */
import fs from "fs";
import path from "path";
import { MongoMemoryReplSet } from "mongodb-memory-server";

async function main() {
  const dbPath = path.join(process.cwd(), ".data", "mongo");
  fs.mkdirSync(dbPath, { recursive: true });
  const replSet = await MongoMemoryReplSet.create({
    replSet: { name: "rs0", count: 1, storageEngine: "wiredTiger" },
    instanceOpts: [{ port: 27027, dbPath }],
  });
  console.log(`[dev-db] running at ${replSet.getUri("bclearns")}`);
  const stop = async () => {
    await replSet.stop({ doCleanup: false });
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main();
