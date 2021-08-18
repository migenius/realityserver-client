#!/bin/bash

if [ "$npm_package_version" == "" ]; then
    echo "Not running in NPM, please run as 'npm run mk_release_branch'"
    exit 1
fi

RELEASE_BRANCH="release-$npm_package_version"

# check that we are on master
BRANCH=$(git branch --list master)

if [ "$BRANCH" != "* master" ]; then
    echo "Not on master branch, not branching"
    exit 0 # exit 0 so we don't cause npm to show errors
fi

# check if the release branch exists
BRANCH=$(git branch --list "$RELEASE_BRANCH")

if [ "$BRANCH" != "" ]; then
    echo "release branch $RELEASE_BRANCH already exists"
    exit 0 # exit 0 so we don't cause npm to show errors
fi

# create branch
echo -n "Ready to create release branch $RELEASE_BRANCH, enter Y to continue: "
read line
if [ "$line" == "Y" ]; then
    git branch "$RELEASE_BRANCH"
    echo "Release branch $RELEASE_BRANCH created, use 'git checkout $RELEASE_BRANCH' to access it."
else
    echo "Not creating since you entered '${line}'"
fi
