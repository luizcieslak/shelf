# PocketBase Directory

This folder contains PocketBase and its migrations for local development.

## What's Included in Git

- ✅ `pb_migrations/` - Database schema migrations (safe to commit)
- ✅ This README

## What's Ignored (Not in Git)

- ❌ `pb_data/` - Contains user data, OAuth2 secrets, session tokens
- ❌ `pocketbase` - Binary executable
- ❌ `CHANGELOG.md`, `LICENSE.md` - PocketBase docs

## Local Development Setup

### 1. Download PocketBase Binary

If you don't have the binary yet:

```bash
# macOS ARM (M1/M2/M3)
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_darwin_arm64.zip
unzip pocketbase_*.zip -d pocketbase/
rm pocketbase_*.zip

# macOS Intel
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_darwin_amd64.zip
unzip pocketbase_*.zip -d pocketbase/
rm pocketbase_*.zip

# Linux
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip
unzip pocketbase_*.zip -d pocketbase/
rm pocketbase_*.zip

# Make executable
chmod +x pocketbase/pocketbase
```

Or download from: https://pocketbase.io/docs/

### 2. Start PocketBase

```bash
cd pocketbase
./pocketbase serve
```

Migrations will auto-apply on first startup!

### 3. Access Admin UI

Open http://127.0.0.1:8090/_/

- First time: Create admin account
- Configure OAuth2 providers (Spotify, Google)

### 4. Verify Collections

In Admin UI → Collections → You should see:
- `users` (auto-created)
- `playlists` (from migration)

## Production Deployment

For production, you only need:
- The PocketBase binary for your platform
- The `pb_migrations/` folder

See [DEPLOYMENT.md](../DEPLOYMENT.md) for full deployment guide.

## Folder Structure

```
pocketbase/
├── README.md              # This file (committed)
├── pocketbase             # Binary (gitignored)
├── pb_migrations/         # Schema migrations (committed)
│   ├── 1757186996_updated_users.js
│   ├── 1757187682_updated_users.js
│   ├── 1757523789_updated_users.js
│   ├── 1757525298_updated_users.js
│   ├── 1757525308_updated_users.js
│   ├── 1773939078_collections_snapshot.js
│   └── 1742401200_created_playlists.js
└── pb_data/               # Runtime data (gitignored)
    ├── data.db            # User data, OAuth2 secrets
    ├── auxiliary.db       # Metadata
    ├── backups/           # Auto backups
    ├── storage/           # Uploaded files
    └── types.d.ts         # TypeScript definitions
```

## Common Commands

```bash
# Start server
./pocketbase serve

# Start with debug logging
./pocketbase serve --debug

# Create a new migration manually
./pocketbase migrate create "migration_name"

# Apply pending migrations
./pocketbase migrate up

# Rollback last migration
./pocketbase migrate down
```

## Troubleshooting

### "pocketbase: command not found"

Make sure the binary is executable:
```bash
chmod +x pocketbase/pocketbase
```

### "Address already in use"

Another process is using port 8090:
```bash
lsof -ti:8090 | xargs kill -9
```

### Migrations not applying

Check migrations are in the correct location:
```bash
ls pb_migrations/
```

Restart PocketBase to apply:
```bash
./pocketbase serve
```
