#!/bin/sh
# Simula ng Alertmanager (Day 84). Hindi kayang magbasa ng env var ang Alertmanager config, kaya:
#   1. isinusulat ang SMTP password sa tmpfs (nasa memory lang, hindi sa disk, 0600, hindi sa Git)
#   2. pinapalitan ang __ALERT_EMAIL_TO__ sa config
#   3. inaalis ang password sa environment bago simulan ang alertmanager
set -eu
umask 077
case "$ALERT_EMAIL_TO" in
  *@*.*) ;;
  *) echo "❌ ALERT_EMAIL_TO ay hindi mukhang email" >&2; exit 1 ;;
esac
case "$ALERT_EMAIL_TO" in
  *[\|\'\ ]*) echo "❌ ALERT_EMAIL_TO: bawal ang | ' at espasyo" >&2; exit 1 ;;
esac
printf '%s' "$ALERT_SMTP_PASSWORD" > /run/alertmanager/smtp_password
sed "s|__ALERT_EMAIL_TO__|$ALERT_EMAIL_TO|" /etc/alertmanager/alertmanager.yml > /run/alertmanager/alertmanager.yml
unset ALERT_SMTP_PASSWORD
exec /bin/alertmanager \
  --config.file=/run/alertmanager/alertmanager.yml \
  --storage.path=/alertmanager \
  --web.external-url=http://127.0.0.1:9094 \
  --cluster.listen-address=  # iisang instance lang — patayin ang HA "gossip" (walang bukas na cluster port)
