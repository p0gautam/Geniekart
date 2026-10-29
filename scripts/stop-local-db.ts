import { execFile } from 'node:child_process';
import path from 'node:path';
if (process.platform !== 'win32')
  throw new Error('Stop the db:local process with Ctrl+C on this platform.');
execFile(
  path.resolve('node_modules/@embedded-postgres/windows-x64/native/bin/pg_ctl.exe'),
  ['stop', '-D', path.resolve('.local/postgres'), '-m', 'fast'],
  { windowsHide: true },
  (error, stdout) => {
    if (error) {
      console.error('Unable to stop local PostgreSQL.');
      process.exitCode = 1;
    } else console.log(stdout);
  },
);
