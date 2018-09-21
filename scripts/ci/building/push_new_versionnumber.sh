#!/bin/bash

# Exit  immediately  if  a pipeline (which may consist of a single simple command), a list, or a compound command
# (see SHELL GRAMMAR above),  exits with a non-zero status.
set -e
# After expanding each simple command, for command, case command, select command, or arithmetic for command,
# display the expanded value of PS4, followed by the command and its expanded  arguments  or  associated word list.
#set -x

echo "prepare some variables"
echo "########################################'"
echo "bamboo_jira_version=$bamboo_jira_version"
echo "bamboo_jira_version_manually=$bamboo_jira_version_manually"
echo "bamboo_planRepository_branchName=$bamboo_planRepository_branchName"

if [ -z $bamboo_jira_version ] && [ -z $bamboo_jira_version_manually ]; then
    echo 'No new version to commit and push since we are not pushing the build numbers anymore'
else
  echo "Found jira version-number in release branch: ${bamboo_jira_version}"

  echo "prepare jira version to set: manually set version overwrites auto jira version"
  echo "########################################'"
  if [ -n "$bamboo_jira_version" ]; then
    jira_version=$bamboo_jira_version
  fi
  if [ -n "$bamboo_jira_version_manually" ]; then
    jira_version=$bamboo_jira_version_manually
  fi
  echo "jira_version=$jira_version"

  echo "push commit and tag for new set version"
  echo "########################################'"
  remote=origin

  echo "git remote remove $remote"
  git remote remove $remote

  remote_url=https://$bamboo_git_USER_NAME:$bamboo_git_PASSWORD@github.com/iteratec/OpenSpeedMonitor.git
  echo "set remote $remote to '$remote_url'"
  git remote add -f $remote $remote_url

  git config user.email 'osm@iteratec.de'
  git config user.name 'bamboo iteratec'

  # the following commit message is referenced by regex in bamboo to exclude these commits
  # while picking up changes (configured in bamboo repositories advanced settings)
  echo "git commit -am '[${jira_version}] version update'"
  git status
  git commit -am "[${jira_version}] version update"

  echo "pull --rebase $remote release"
  git pull --rebase $remote release

  echo "git tag 'v${jira_version}'"
  git tag "v${jira_version}"
  echo "git push --tags $remote HEAD:refs/heads/release"
  git push --tags $remote HEAD:refs/heads/release
fi