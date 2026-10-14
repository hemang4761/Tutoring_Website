import mongoose from "mongoose";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalForMongo = globalThis as unknown as { __mongoose?: Cache };
const cache: Cache = globalForMongo.__mongoose ?? { conn: null, promise: null };
globalForMongo.__mongoose = cache;

export async function connectDB() {
  if (cache.conn) return cache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 8000 });
  }
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}

// strips mongoose types so documents can be passed to client components
export function plain<T>(value: T): Serialized<T> {
  return JSON.parse(JSON.stringify(value));
}

type Serialized<T> = T extends { toHexString(): string }
  ? string
  : T extends Date
    ? string
    : T extends Array<infer U>
      ? Serialized<U>[]
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;
