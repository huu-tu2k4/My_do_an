import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'auth.log');

const append = (line) => {
  const ts = new Date().toISOString();
  try {
    fs.appendFileSync(logFile, `[${ts}] ${line}\n`);
  } catch (e) {
    // ignore file write errors
    console.log('Logger write failed', e);
  }
};

export default {
  info: (msg) => append(`INFO: ${msg}`),
  warn: (msg) => append(`WARN: ${msg}`),
  error: (msg) => append(`ERROR: ${msg}`),
};
