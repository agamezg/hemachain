import Database from "better-sqlite3";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(here, "..", "indexer.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    contract  TEXT    NOT NULL,
    name      TEXT    NOT NULL,
    block     INTEGER NOT NULL,
    tx        TEXT    NOT NULL,
    log_index INTEGER NOT NULL,
    severity  TEXT    NOT NULL,
    args      TEXT    NOT NULL,
    seen_at   INTEGER NOT NULL,
    UNIQUE (tx, log_index)
  );
`);

const insertStmt = db.prepare(`
  INSERT OR IGNORE INTO events (contract, name, block, tx, log_index, severity, args, seen_at)
  VALUES (@contract, @name, @block, @tx, @log_index, @severity, @args, @seen_at)
`);

/** Returns true when the row was newly inserted (false on duplicate tx+log). */
export function insertEvent(rec) {
  const info = insertStmt.run({
    contract: rec.contract,
    name: rec.name,
    block: rec.block,
    tx: rec.tx,
    log_index: rec.log_index,
    severity: rec.severity,
    args: JSON.stringify(rec.args),
    seen_at: Date.now(),
  });
  return info.changes > 0;
}

const recentStmt = db.prepare(`
  SELECT contract, name, block, tx, log_index AS logIndex, severity, args, seen_at AS ts
  FROM events ORDER BY block DESC, log_index DESC LIMIT ?
`);

export function recentEvents(limit = 50) {
  return recentStmt.all(limit).map((r) => ({ ...r, args: JSON.parse(r.args) }));
}

export function eventCount() {
  return db.prepare(`SELECT COUNT(*) AS c FROM events`).get().c;
}
