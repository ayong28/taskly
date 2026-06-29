import { unlink } from "fs/promises";
import path from "path";

export default async function globalSetup() {
  const testDb = path.join(process.cwd(), "data", "test.db");
  for (const file of [testDb, `${testDb}-shm`, `${testDb}-wal`]) {
    await unlink(file).catch(() => {});
  }
}
