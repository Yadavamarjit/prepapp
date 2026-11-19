#!/usr/bin/env bash
set -euo pipefail
test "$(id -u)" = 0
# A 448 MB crash-kernel reserve consumes almost half this 1 GB instance.
# Keep persistent logs, but disable full kernel crash dumps on this small host.
systemctl disable --now kdump
if test -r /sys/kernel/kexec_crash_loaded && test "$(cat /sys/kernel/kexec_crash_loaded)" != 0; then
  echo 'Crash kernel is still loaded; not changing its reservation.' >&2
  exit 1
fi
if test -r /sys/kernel/kexec_crash_size && test "$(cat /sys/kernel/kexec_crash_size)" -gt 0; then
  echo 0 > /sys/kernel/kexec_crash_size
fi
if ! test -f /etc/default/grub.before-prepapp; then cp -p /etc/default/grub /etc/default/grub.before-prepapp; fi
grubby --update-kernel=ALL --remove-args=crashkernel
install -d -m 0755 /etc/systemd/journald.conf.d
cat >/etc/systemd/journald.conf.d/prepapp.conf <<'LOG'
[Journal]
Storage=persistent
SystemMaxUse=32M
RuntimeMaxUse=8M
MaxRetentionSec=14day
LOG
systemd-tmpfiles --create --prefix /var/log/journal
systemctl restart systemd-journald
journalctl --flush
printf 'Crash-kernel reservation remaining (bytes): '
cat /sys/kernel/kexec_crash_size
free -h
