// Start / stop / status for the self-contained demo Postgres on port 5433.
// Uses the PostgreSQL 18 binaries bundled with the local install.
//
// Forward slashes work fine on Windows and avoid backslash-escape pitfalls.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const PG_BIN = process.env.PG_BIN ?? "C:/Program Files/PostgreSQL/18/bin";
const DATADIR = process.env.PGDATA_DIR ?? path.resolve("./.pgdata");
const PORT = process.env.PGPORT ?? "5433";
const pgCtl = path.join(PG_BIN, "pg_ctl.exe");

const cmd = process.argv[2];
if (!existsSync(DATADIR)) {
  console.error(
    `Data dir ${DATADIR} not found. See README "PostgreSQL setup".`,
  );
  process.exit(1);
}

const args = {
  start: [
    "-D",
    DATADIR,
    "-o",
    `-p ${PORT}`,
    "-l",
    path.join(DATADIR, "server.log"),
    "start",
  ],
  stop: ["-D", DATADIR, "stop"],
  status: ["-D", DATADIR, "status"],
}[cmd];

if (!args) {
  console.error("Usage: node scripts/db.mjs <start|stop|status>");
  process.exit(1);
}

const r = spawnSync(pgCtl, args, { stdio: "inherit" });
process.exit(r.status ?? 0);
