// Database migrations CLI.
//   npm run migrate -w backend          apply pending migrations
//   npm run migrate:status -w backend   list applied / pending migrations
//   npm run migrate:undo -w backend     revert the most recent migration
import { sequelize, closeDatabase } from '../src/config/database.js';
import { createMigrator } from '../src/database/migrator.js';
import { env } from '../src/config/env.js';
import mysql from 'mysql2/promise';

const command = process.argv[2] || 'up';

async function ensureDatabase() {
  if (env.isProduction) return;
  const { host, port, user, password, name } = env.db;
  const conn = await mysql.createConnection({ host, port, user, password });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.end();
}

async function main() {
  await ensureDatabase();
  await sequelize.authenticate();
  const migrator = createMigrator(sequelize);

  if (command === 'status') {
    const [executed, pending] = await Promise.all([migrator.executed(), migrator.pending()]);
    executed.forEach((m) => console.log(`  applied   ${m.name}`));
    pending.forEach((m) => console.log(`  pending   ${m.name}`));
    if (!executed.length && !pending.length) console.log('  no migrations');
  } else if (command === 'down') {
    const [reverted] = await migrator.down({ step: 1 });
    console.log(reverted ? `Reverted ${reverted.name}` : 'Nothing to revert');
  } else {
    const applied = await migrator.up();
    console.log(applied.length ? `Applied ${applied.length} migration(s)` : 'Database is up to date');
  }
}

main()
  .catch((err) => {
    console.error(`Migration ${command} failed:`, err.message);
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
