#!/bin/sh

echo "BUILD PROD IMAGE"
VERSION_ARG=$1
VERSION=${VERSION_ARG:="0.0.1"}

REGISTRY="registry.susa.cloud"

PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

echo $PACKAGE_VERSION

VERSION_TAG="${REGISTRY}/meet-stenar-si:v${PACKAGE_VERSION}"
echo $VERSION_TAG

LATEST_TAG="${REGISTRY}/meet-stenar-si:latest"

docker build --target release -t $VERSION_TAG -t $LATEST_TAG .
