#!/usr/bin/env bash
set -euo pipefail
umask 027
test "$(id -u)" = 0
install -d -m 0755 /opt/prepapp /opt/prepapp/releases
if ! id prepapp >/dev/null 2>&1; then useradd --system --home-dir /var/lib/prepapp --shell /sbin/nologin prepapp; fi
install -d -m 0750 -o prepapp -g prepapp /var/lib/prepapp
install -d -m 0750 -o root -g prepapp /etc/prepapp
if ! test -x /opt/node-v24.22.3-linux-x64/bin/node; then
  curl --fail --silent --show-error --location --max-time 180 https://nodejs.org/dist/v24.22.3/node-v24.22.3-linux-x64.tar.xz -o /opt/prepapp/node.tar.xz
  echo '4f2b175a6d53a5c617a80dba2676238a0688cef28c6da4eba35c7d844e66fcfb  /opt/prepapp/node.tar.xz' | sha256sum --check
  tar -xJf /opt/prepapp/node.tar.xz -C /opt
fi
ln -sfn /opt/node-v24.22.3-linux-x64/bin/node /usr/local/bin/node
ln -sfn /opt/node-v24.22.3-linux-x64/bin/npm /usr/local/bin/npm
if ! test -x /usr/local/bin/caddy; then
  curl --fail --silent --show-error --location --max-time 180 'https://caddyserver.com/api/download?os=linux&arch=amd64' -o /opt/prepapp/caddy.download
  install -m 0755 /opt/prepapp/caddy.download /usr/local/bin/caddy
fi
if ! id caddy >/dev/null 2>&1; then useradd --system --home-dir /var/lib/caddy --shell /sbin/nologin caddy; fi
install -d -m 0750 -o caddy -g caddy /var/lib/caddy
install -d -m 0755 /etc/caddy
python3 -m venv /opt/prepapp/venv
/opt/prepapp/venv/bin/python -m pip install --disable-pip-version-check --only-binary=:all: PyMuPDF pdfplumber
chown -R root:prepapp /opt/prepapp/venv
chmod -R g+rX,o-rwx /opt/prepapp/venv
if ! test -f /etc/prepapp/backend.env; then
  python3 - <<'PY'
import secrets
from pathlib import Path
Path('/etc/prepapp/backend.env').write_text('NODE_ENV=production\nAPI_ONLY=true\nHOST=127.0.0.1\nPORT=3000\nDATA_DIR=/var/lib/prepapp\nPYTHON_BIN=/opt/prepapp/venv/bin/python\nFIREBASE_PROJECT_ID=gen-lang-client-0456258653\nALLOWED_ORIGINS=https://prepapp-five.vercel.app,https://prepapp-amarjits-projects-cd5ca462.vercel.app\nAI_USER_DAILY_LIMIT=30\nAI_GLOBAL_DAILY_LIMIT=100\nSESSION_SECRET=' + secrets.token_hex(48) + '\n')
PY
fi
chown root:prepapp /etc/prepapp/backend.env
chmod 0640 /etc/prepapp/backend.env
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --add-service=http
firewall-cmd --add-service=https
cat >/etc/ssh/sshd_config.d/90-prepapp.conf <<'SSH'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
MaxAuthTries 3
MaxStartups 10:30:30
SSH
sshd -t
systemctl reload sshd
/usr/local/bin/node --version
/usr/local/bin/caddy version
/opt/prepapp/venv/bin/python -c 'import pymupdf, pdfplumber; print("PDF dependencies ready")'
