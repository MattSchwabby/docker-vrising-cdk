while : 
do
    echo 'Checking if VRisingServer.exe is running'
    sh -c ps -A | grep 'VRisingServer*' | grep -v grep
    sleep 60;
done;