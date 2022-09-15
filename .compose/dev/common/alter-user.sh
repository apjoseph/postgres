#!/usr/bin/env bash

set -Eeo pipefail

TARGET_USER=$1
OWNER_UID=$2
TARGET_GROUP=$3
OWNER_GID=$4
OLD_GROUP_ID=$(id -g $TARGET_GROUP)
OLD_USER_ID=$(id -u $TARGET_USER)

groupmod -g $OWNER_GID $TARGET_GROUP
usermod -u $OWNER_UID  $TARGET_USER

find / -ignore_readdir_race \( -group $OLD_GROUP_ID -o -user $OLD_USER_ID \) -print0 | while IFS= read -r -d '' file
do
  mapfile -t stat_data < <( stat --printf="%u\n%g" "$file" )
  f_uid=${stat_data[0]}
  f_gid=${stat_data[1]}

  if (( $f_uid == $OLD_USER_ID )); then
    chown -h $TARGET_USER "$file"
  fi

  if (($f_gid == $OLD_GROUP_ID)); then
    chgrp -h $TARGET_GROUP "$file"
  fi

done
