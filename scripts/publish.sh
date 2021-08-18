#!/bin/bash

if [ "$npm_package_version" == "" ]; then
    echo "Not running in NPM, please run as 'npm run build:publish'"
    exit 1
fi

RELEASE_BRANCH="release-$npm_package_version"
# check we're on the release branch
BRANCH=$(git branch --list "$RELEASE_BRANCH")

if [ "$BRANCH" != "* $RELEASE_BRANCH" ]; then
    echo "Not on release branch, not publishing"
    exit 0 # exit 0 so we don't cause npm to show errors
fi

# do a build to make sure we're up to date
if npm run build; then
    # and now publish
    echo -n "Ready to publish ${npm_package_name}:${npm_package_version}, enter Y to continue: "
    read line
    if [ "$line" == "Y" ]; then
        npm publish --access public
    else
        echo "Not publising since you entered '${line}'"
    fi
else
    echo "Build failed, not publishing"
fi