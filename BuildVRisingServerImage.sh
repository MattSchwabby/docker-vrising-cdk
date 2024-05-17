#!/bin/bash

config=$(jq -c . src/config.json)
ImageName=$(echo "$config" | jq -r '.ImageName')
EcrRepoUri=$(echo "$config" | jq -r '.EcrRepoUri')
Region=$(echo "$config" | jq -r '.Region')
PersistentDataBucket=$(echo "$config" | jq -r '.PersistentDataBucket')
aws ecr get-login-password --region "$Region" | docker login --username AWS --password-stdin "$EcrRepoUri"
cd src
aws s3 sync "s3://$PersistentDataBucket" ./persistentdata --delete
docker build -t "$ImageName" .
docker tag "$ImageName:latest" "$EcrRepoUri:latest"
docker push "$EcrRepoUri:latest"
cd ..