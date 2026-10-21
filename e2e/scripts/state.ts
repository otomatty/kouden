import path from "node:path";

/** E2E 専用の Miniflare の保存先（開発中のデータとは分ける） */
export const STATE_DIR = path.resolve(import.meta.dirname, "../.state");
