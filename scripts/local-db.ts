import EmbeddedPostgres from 'embedded-postgres';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
const exec = promisify(execFile);
async function main() {
  mkdirSync('.local', { recursive: true });
  const file = '.local/db-password';
  const password = existsSync(file) ? readFileSync(file, 'utf8') : randomBytes(32).toString('hex');
  if (!existsSync(file)) writeFileSync(file, password, { mode: 0o600 });
  const pg = new EmbeddedPostgres({
    databaseDir: '.local/postgres',
    user: 'geniekart',
    password,
    port: 54329,
    persistent: true,
    authMethod: 'scram-sha-256',
    postgresFlags: ['-h', '127.0.0.1'],
  });
  if (!existsSync('.local/postgres/PG_VERSION')) await pg.initialise();
  if (process.platform === 'win32') {
    const ctl = path.resolve('node_modules/@embedded-postgres/windows-x64/native/bin/pg_ctl.exe');
    let running = false;
    try {
      await exec(ctl, ['status', '-D', path.resolve('.local/postgres')]);
      running = true;
    } catch {}
    if (!running)
      await new Promise<void>((resolve, reject) => {
        const child = spawn(
          ctl,
          [
            'start',
            '-D',
            path.resolve('.local/postgres'),
            '-l',
            path.resolve('.local/postgres.log'),
            '-o',
            '-p 54329 -h 127.0.0.1',
          ],
          { windowsHide: true, stdio: 'ignore' },
        );
        child.on('error', reject);
        child.on('exit', (code) =>
          code === 0
            ? resolve()
            : reject(new Error('pg_ctl could not start PostgreSQL. See .local/postgres.log.')),
        );
      });
  } else await pg.start();
  const client = pg.getPgClient('postgres', '127.0.0.1');
  await client.connect();
  const result = await client.query("SELECT 1 FROM pg_database WHERE datname='geniekart'");
  await client.end();
  if (!result.rowCount) await pg.createDatabase('geniekart');
  if (!existsSync('.env'))
    writeFileSync(
      '.env',
      `DATABASE_URL="postgresql://geniekart:${password}@127.0.0.1:54329/geniekart"\nSITE_URL="http://localhost:3000"\nMEDIA_DRIVER="local"\n`,
      { mode: 0o600 },
    );
  console.log(
    'Local PostgreSQL ready on 127.0.0.1:54329. Credentials saved only in ignored local files.',
  );
  const stop = async () => {
    if (process.platform === 'win32')
      await exec(
        path.resolve('node_modules/@embedded-postgres/windows-x64/native/bin/pg_ctl.exe'),
        ['stop', '-D', path.resolve('.local/postgres'), '-m', 'fast'],
        { windowsHide: true },
      );
    else await pg.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  setInterval(() => {}, 60000);
}
main().catch((e) => {
  console.error(e?.message || 'PostgreSQL initialization failed; see diagnostics above.');
  process.exit(1);
});
