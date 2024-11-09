#!/bin/bash

if [ -z "$1" ]; then
  echo "Vui lòng cung cấp tên bản phát hành cũ."
  exit 1
fi

MY_OLD_RELEASE=$1

cd ..

lns -snf "$MY_OLD_RELEASE" current

pm2 startOrReload ecosystem.config.js