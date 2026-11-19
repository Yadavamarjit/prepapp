#!/usr/bin/env bash
set -euo pipefail
test "$(id -u)" = 0
work_dir="$(mktemp -d /tmp/prepapp-ca.XXXXXXXX)"
trap 'rm -f "$work_dir/root-ye.pem" "$work_dir/root-x2.pem"; rmdir "$work_dir"' EXIT
curl --fail --silent --show-error --location --max-time 30 https://letsencrypt.org/certs/gen-y/root-ye-by-x2.pem --output "$work_dir/root-ye.pem"
curl --fail --silent --show-error --location --max-time 30 https://letsencrypt.org/certs/gen-y/root-x2-by-x1.pem --output "$work_dir/root-x2.pem"
# Validate the missing cross-signatures against the existing OS trust anchors.
openssl verify -CAfile /etc/pki/tls/certs/ca-bundle.crt "$work_dir/root-x2.pem"
openssl verify -CAfile /etc/pki/tls/certs/ca-bundle.crt -untrusted "$work_dir/root-x2.pem" "$work_dir/root-ye.pem"
cat /etc/pki/tls/certs/ca-bundle.crt "$work_dir/root-x2.pem" "$work_dir/root-ye.pem" >/etc/prepapp/ncert-ca.pem
chmod 0644 /etc/prepapp/ncert-ca.pem
python3 - <<'PY'
from pathlib import Path
environment = Path('/etc/prepapp/backend.env')
values = dict(line.split('=', 1) for line in environment.read_text().splitlines() if '=' in line)
values['CURL_CA_BUNDLE'] = '/etc/prepapp/ncert-ca.pem'
values['NODE_EXTRA_CA_CERTS'] = '/etc/prepapp/ncert-ca.pem'
environment.write_text(''.join(f'{key}={value}\n' for key, value in values.items()))
environment.chmod(0o640)
PY
systemctl restart prepapp
echo 'Verified application certificate bundle configured; TLS verification remains enabled.'
python3 - <<'PY'
from pathlib import Path
target = Path('/etc/prepapp/backend.env')
values = dict(line.split('=', 1) for line in target.read_text().splitlines() if '=' in line)
values['CURL_CA_BUNDLE'] = '/etc/prepapp/ncert-ca.pem'
values['NODE_EXTRA_CA_CERTS'] = '/etc/prepapp/ncert-ca.pem'
target.write_text(''.join(f'{key}={value}\n' for key, value in values.items()))
target.chmod(0o640)
PY
systemctl restart prepapp
