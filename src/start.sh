#!/bin/bash

echo "Logging environment variables"
echo "Server path is $ServerDataPath"
echo "persistent data path is $PersistentDataPath"
echo "Server name $ServerName"
echo "Save name is $WorldName"
echo "Game port is $GamePort"
echo "Query port is $QueryPort"

echo "steam_appid: "`cat $ServerDataPath/steam_appid.txt`
echo " "
echo " "
cd "$ServerDataPath"
echo "Starting V Rising Dedicated Server with persistent data path: $PersistentDataPath, server name: $ServerName world/savename: $WorldName log file location: $PersistentDataPath/$LogFile on game port: $GamePort and query port: $QueryPort"
echo "Trying to remove /tmp/.X0-lock"
rm /tmp/.X0-lock 2>&1
echo " "
echo "Starting Xvfb"
Xvfb :0 -screen 0 1024x768x16 &
echo "Launching wine64 V Rising"
echo " "
echo "Starting backup script"
bash /backup.sh &

aws s3 sync "s3://$PersistentDataBucket" $PersistentDataPath --delete

DISPLAY=:0.0 wine64 /mnt/vrising/server/VRisingServer.exe -persistentDataPath $PersistentDataPath -serverName "$ServerName" -saveName "$WorldName" -logFile "$PersistentDataPath/$LogFile" "$GamePort" "$QueryPort" 2>&1 &
ServerPID=$!
echo "Server PID is:"
echo $ServerPID
echo "Starting script to log server PID"
bash /logserverpid.sh &

echo 'Testing health check command "sh", "-c", "ps aux | grep 'wine.VRisingServer.exe' | grep -v grep"'
sh -c ps -A | grep 'VRisingServer*' | grep -v grep

# Tail log file and waits for Server PID to exit
/usr/bin/tail -n 0 -f $PersistentDataPath/$LogFile &
wait
