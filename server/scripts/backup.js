/**
 * M-CHICKS Database Backup Script
 * Usage: node server/scripts/backup.js
 * Creates a timestamped mongodump of the mchicks database.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T').join('_');
const backupDir = path.join(__dirname, '../../backups', `mchicks_${timestamp}`);

fs.mkdirSync(backupDir, { recursive: true });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mchicks';

try {
  console.log(`Creating backup to: ${backupDir}`);
  execSync(`mongodump --uri="${MONGO_URI}" --out="${backupDir}"`, { stdio: 'inherit' });
  console.log(`✅ Backup complete: ${backupDir}`);
} catch (err) {
  console.error('❌ Backup failed. Make sure mongodump is installed (part of MongoDB Tools).');
  console.error(err.message);
  process.exit(1);
}
