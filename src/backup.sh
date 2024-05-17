#!/bin/bash

sleep 120; # Wait 2 minutes before trying to back anything up so the server can start and create a save file

while : 
do
    echo "files in $PersistentDataPath"
    ls $PersistentDataPath
    echo "Backing up all persistent data from $PersistentDataPath to $PersistentDataBucket"
    aws s3 sync "$PersistentDataPath" "s3://$PersistentDataBucket" --delete

    sleep 120; # Sleep for 2 minutes
done;