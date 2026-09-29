#!/usr/bin/env bash
# I-install ang araw-araw na backup timer (Day 91) bilang USER service — walang sudo.
#   database/backups/systemd/install.sh            # i-install at simulan
#   database/backups/systemd/install.sh --remove   # alisin
# Linger: para tumakbo ang user timer kahit walang naka-login na terminal (mababawi: loginctl disable-linger)
set -euo pipefail
cd "$(dirname "$0")"
UNIT_DIR="$HOME/.config/systemd/user"
if [[ "${1:-}" == "--remove" ]]; then
  systemctl --user disable --now auth-learning-backup.timer || true
  rm -f "$UNIT_DIR/auth-learning-backup.service" "$UNIT_DIR/auth-learning-backup.timer"
  systemctl --user daemon-reload
  echo "Inalis. (Linger ay hindi binago — loginctl disable-linger kung gusto)"
  exit 0
fi
mkdir -p "$UNIT_DIR"
# Symlink: ang nasa repo ang laging ginagamit (may kasaysayan at review ang pagbabago)
ln -sf "$PWD/auth-learning-backup.service" "$UNIT_DIR/auth-learning-backup.service"
ln -sf "$PWD/auth-learning-backup.timer" "$UNIT_DIR/auth-learning-backup.timer"
systemctl --user daemon-reload
systemctl --user enable --now auth-learning-backup.timer
loginctl enable-linger "$(whoami)"
systemctl --user list-timers auth-learning-backup.timer --no-pager
