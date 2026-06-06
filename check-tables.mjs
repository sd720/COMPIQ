// check-tables.mjs — check what tables exist
import { readFileSync } from 'fs';
import pg from 'pg';
const { Client } = pg;

const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.substring(0, eqIdx).trim();
  let val = trimmed.substring(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
  envVars[key] = val;
}

const client = new Client({ connectionString: envVars.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
console.log('Tables:', res.rows.map(r => r.table_name));

// Check columns of Company table
if (res.rows.length > 0) {
  const tableName = res.rows[0].table_name;
  const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1 LIMIT 5`, [tableName]);
  console.log(`Columns of "${tableName}":`, cols.rows.map(r => r.column_name));
}

await client.end();
