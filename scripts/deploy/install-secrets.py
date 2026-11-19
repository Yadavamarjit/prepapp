#!/usr/bin/env python3
"""Install only the provider settings explicitly approved for this server."""
from pathlib import Path
import os
import re

if os.geteuid() != 0:
    raise SystemExit('Run as root')
destination = Path('/etc/prepapp/backend.env')
transfer = Path('/home/opc/prepapp.keys.env')
allowed = {'OPENAI_API_KEY', 'GEMINI_API_KEY', 'OPENAI_PLANNER_MODEL', 'OPENAI_CURRENT_AFFAIRS_MODEL', 'OPENAI_TUTOR_MODEL', 'GEMINI_MODEL'}
values = dict(line.split('=', 1) for line in destination.read_text().splitlines() if '=' in line)
for line in transfer.read_text().splitlines():
    if '=' not in line:
        continue
    key, value = line.split('=', 1)
    if key in allowed and re.fullmatch(r'[A-Za-z0-9_./:-]+', value):
        values[key] = value
values['AI_PROVIDER'] = 'openai'
destination.write_text(''.join(f'{key}={value}\n' for key, value in values.items()))
destination.chmod(0o640)
transfer.unlink()
print('Provider configuration installed; temporary transfer file removed.')
