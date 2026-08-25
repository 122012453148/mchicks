# M-CHICKS Database Backup Guide

## Development Backup (mongodump)

### Prerequisites
- MongoDB Database Tools installed: https://www.mongodb.com/try/download/database-tools

### Create Backup
```bash
node server/scripts/backup.js
```
This creates a timestamped folder in `/backups/`.

### Manual Backup
```bash
mongodump --uri="mongodb://localhost:27017/mchicks" --out="./backups/manual_backup"
```

### Restore from Backup
```bash
mongorestore --uri="mongodb://localhost:27017/mchicks" ./backups/mchicks_TIMESTAMP/mchicks
```

---

## Production Backup (MongoDB Atlas)

If using MongoDB Atlas:
1. Go to your cluster → Backups tab
2. Enable automated backups (daily recommended)
3. Set retention period (minimum 7 days recommended)
4. Test restore at least once before production use

---

## Collections

| Collection | Purpose |
|-----------|---------|
| batches | Batch records (placement info) |
| dailylogs | Daily feed, mortality, environment logs |
| weightrecords | Periodic bird weight samples |
| supplements | Supplement cost records |
| expenses | Operating expense records |
| supervisorvisits | Field supervisor inspection reports |
| settings | Farm-wide configuration |
| users | Authentication records (hashed passwords) |

---

## Important Warnings

> ⚠️ NEVER run `db.dropDatabase()` on the production database.
> ⚠️ NEVER share MongoDB connection strings publicly.
> ⚠️ Always test restore on a separate database before relying on it.
> ⚠️ Backups should be stored separately from the application server.
