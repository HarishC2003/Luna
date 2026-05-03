import postgres from 'postgres';

const sql = postgres('postgresql://postgres:Harish@0919@db.czirfhrekwzdlpxlpcrg.supabase.co:5432/postgres', { ssl: 'require' });

try {
  await sql.unsafe("NOTIFY pgrst, 'reload schema'");
  console.log('Schema cache reloaded!');
} catch (err) {
  console.error(err);
} finally {
  process.exit(0);
}
