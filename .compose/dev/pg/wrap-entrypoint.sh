#!/usr/bin/env bash

set -Eeo pipefail

shopt -s dotglob
rm -rf /ssl/*
openssl req -new -x509 -nodes -days 365 -text -subj "/CN=localhost" -extensions v3_req -config <(cat /etc/ssl/openssl.cnf <(printf "\n[v3_req]\nbasicConstraints=critical,CA:TRUE\nkeyUsage=nonRepudiation,digitalSignature,keyEncipherment\nsubjectAltName=DNS:localhost")) -keyout /ssl/server.key -out /ssl/server.crt
chmod og-rwx /ssl/server.key

exec docker-entrypoint.sh "$@"
