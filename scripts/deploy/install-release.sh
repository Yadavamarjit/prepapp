#!/usr/bin/env bash
set -euo pipefail
umask 027
test "$(id -u)" = 0
release="${1:?Release identifier required}"
[[ "$release" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]{0,63}$ ]]
release_dir="/opt/prepapp/releases/$release"
install -d -m 0750 -o root -g prepapp "$release_dir"
tar -xzf /home/opc/prepapp-backend.tar.gz -C "$release_dir" --no-same-owner
cd "$release_dir"
export PATH=/usr/local/bin:/usr/bin:/bin
export NODE_OPTIONS=--max-old-space-size=128
npm ci --omit=dev --ignore-scripts --no-fund
chown -R root:prepapp "$release_dir"
chmod -R o-rwx "$release_dir"
if test -f /home/opc/prepapp.keys.env; then
  python3 - <<'PY'
from pathlib import Path
import re
destination = Path('/etc/prepapp/backend.env')
values = dict(line.split('=', 1) for line in destination.read_text().splitlines() if '=' in line)
for line in Path('/home/opc/prepapp.keys.env').read_text().splitlines():
    if '=' not in line:
        continue
    key, value = line.split('=', 1)
    if key in {'OPENAI_API_KEY', 'GEMINI_API_KEY', 'OPENAI_PLANNER_MODEL', 'OPENAI_CURRENT_AFFAIRS_MODEL', 'OPENAI_TUTOR_MODEL', 'GEMINI_MODEL'} and re.fullmatch(r'[A-Za-z0-9_./:-]+', value):
        values[key] = value
values['AI_PROVIDER'] = 'openai'
destination.write_text(''.join(f'{key}={value}\n' for key, value in values.items()))
Path('/home/opc/prepapp.keys.env').unlink()
PY
fi
chown root:prepapp /etc/prepapp/backend.env
chmod 0640 /etc/prepapp/backend.env
previous="$(readlink -f /opt/prepapp/current || true)"
ln -sfn "$release_dir" /opt/prepapp/current
install -m 0644 /home/opc/prepapp-units/prepapp.service /etc/systemd/system/prepapp.service
install -m 0644 /home/opc/prepapp-units/caddy.service /etc/systemd/system/caddy.service
install -m 0644 /home/opc/prepapp-units/prepapp-backup.service /etc/systemd/system/prepapp-backup.service
install -m 0644 /home/opc/prepapp-units/prepapp-backup.timer /etc/systemd/system/prepapp-backup.timer
install -m 0644 /home/opc/prepapp-units/Caddyfile /etc/caddy/Caddyfile
systemctl daemon-reload
systemctl enable prepapp caddy prepapp-backup.timer
systemctl restart prepapp
healthy=false
for attempt in $(seq 1 20); do
  if curl --fail --silent --max-time 3 http://127.0.0.1:3000/api/health; then healthy=true; break; fi
  sleep 1
done
if ! $healthy; then
  if test -n "$previous" && test "$previous" != "$release_dir"; then ln -sfn "$previous" /opt/prepapp/current; systemctl restart prepapp; fi
  echo 'New backend failed its health check' >&2
  exit 1
fi
/usr/local/bin/caddy validate --config /etc/caddy/Caddyfile
systemctl restart caddy
systemctl start prepapp-backup.timer
systemctl start prepapp-backup.service
systemctl --no-pager --full status prepapp caddy prepapp-backup.timer
