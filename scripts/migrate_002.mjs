import postgres from 'postgres';
import fs from 'fs';
const sql = postgres('postgresql://postgres:Harish@0919@db.czirfhrekwzdlpxlpcrg.supabase.co:5432/postgres', { ssl: 'require' });
const query = fs.readFileSync('supabase/migrations/002_cycle_tracker.sql', 'utf8');
try {
  await sql.unsafe(query);
  console.log('Module 2 Schema Migrated successfully!');
} catch (e) {
  console.error(e);
}
process.exit(0);
