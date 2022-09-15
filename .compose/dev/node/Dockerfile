ARG DEBIAN_VERSION
ARG NODE_VERSION

FROM node:${NODE_VERSION}-${DEBIAN_VERSION}

ARG DENO_VERSION
ARG POSTGRES_VERSION
ARG NODE_UID
ARG NODE_GID

COPY .compose/dev/common/ /usr/local/bin/
RUN alter-user.sh node $NODE_UID node $NODE_GID \
    && curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor | tee /etc/apt/trusted.gpg.d/apt.postgresql.org.gpg >/dev/null \
    && env -i bash -c '. /etc/os-release; echo ''deb http://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main'' > /etc/apt/sources.list.d/pgdg.list' \
    && apt-get update \
    && apt-get install -y --no-install-recommends postgresql-client-${POSTGRES_VERSION} \
    && apt-get clean  \
    && rm -rf /var/lib/apt/lists/* \
    && npm i -g npm@latest eslint  \
    && curl -fsSL https://deno.land/x/install/install.sh | DENO_INSTALL=/usr/local sh -s "v${DENO_VERSION}" \
    && su node -c 'mkdir -p ~/.cache/deno ~/postgres ~/'
VOLUME ["/home/node/.cache/deno","/home/node/postgres"]

USER node
