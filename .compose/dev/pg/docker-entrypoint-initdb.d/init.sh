#!/usr/bin/env bash

set -Eeo pipefail

sed -i 's/.*hba_file = .*/hba_file = \x27\/pg_hba.conf\x27/' "$PGDATA/postgresql.conf"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
   ALTER SYSTEM SET wal_level = logical;
   ALTER SYSTEM SET ssl_cert_file = '/ssl/server.crt';
   ALTER SYSTEM SET ssl_key_file = '/ssl/server.key';
   ALTER SYSTEM SET ssl = on;
EOSQL

