#!/usr/bin/env python3
"""Consistent SQLite snapshots; run as the restricted service user."""
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from time import time

directory = Path('/var/lib/prepapp')
backups = directory / 'backups'
backups.mkdir(mode=0o700, exist_ok=True)
stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
for name in ('private.sqlite', 'current_affairs.sqlite'):
    source = directory / name
    if source.exists():
        with sqlite3.connect(f'file:{source}?mode=ro', uri=True) as reader:
            with sqlite3.connect(backups / f'{name}.{stamp}.sqlite') as writer:
                reader.backup(writer)
for backup in backups.glob('*.sqlite'):
    if time() - backup.stat().st_mtime > 14 * 86400:
        backup.unlink()
