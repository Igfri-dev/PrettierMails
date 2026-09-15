import { runMigrations } from '../db/migrations.js';
import { runSeeders } from '../db/seeders.js';
import { getActiveEngine, resetConnectionForTesting } from '../db/connection.js';

async function main() {
  console.log('🌱 Ejecutando seeders de base de datos...');
  try {
    await runMigrations();
    const result = await runSeeders();
    console.log(`✅ Seeders completados con éxito (${result.seededCount} plantillas base configuradas en motor: ${getActiveEngine()})`);
  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
    process.exit(1);
  } finally {
    resetConnectionForTesting();
  }
}

main();
