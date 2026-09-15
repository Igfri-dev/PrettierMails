import { runMigrations } from '../db/migrations.js';
import { getActiveEngine, resetConnectionForTesting } from '../db/connection.js';

async function main() {
  console.log('🔄 Ejecutando migraciones de base de datos...');
  try {
    const result = await runMigrations();
    console.log(`✅ Migraciones completadas con éxito en motor: ${result.engine} (${result.tablesCount} tablas verificadas)`);
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  } finally {
    resetConnectionForTesting();
  }
}

main();
