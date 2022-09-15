ARG POSTGRES_VERSION
ARG DEBIAN_VERSION
FROM postgres:${POSTGRES_VERSION}-${DEBIAN_VERSION}

ARG POSTGRES_UID
ARG POSTGRES_GID

COPY .compose/dev/common/ /usr/local/bin/
RUN alter-user.sh postgres $POSTGRES_UID postgres $POSTGRES_GID \
    && mkdir /ssl && chown -R postgres:postgres /ssl /docker-entrypoint-initdb.d
VOLUME ["/ssl"]

USER postgres
