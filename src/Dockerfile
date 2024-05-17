FROM ubuntu:22.04 
LABEL maintainer="Matt Schwabenbauer"

ENV ServerDataPath=/mnt/vrising/server
ENV PersistentDataPath=/mnt/vrising/persistentdata
ENV WorldName='VRisingWorldSave'
ENV ServerName='My ECS V Rising Server'
ENV GamePort=9876
ENV QueryPort=9877
ENV LogFile='VRisingServer.log'
ENV PersistentDataBucket='v-rising-persistent-data-store'

VOLUME [$ServerDataPath, $PersistentDataPath]

ARG DEBIAN_FRONTEND="noninteractive"

RUN echo "Echoing PersistentDataPath"
RUN echo "$PersistentDataPath"
RUN echo "Echoing ServerDataPath"
RUN echo "$ServerDataPath"

RUN apt update -y && \
    apt-get upgrade -y && \
    apt-get install -y  apt-utils && \
    apt-get install -y  software-properties-common \
                        tzdata && \
    add-apt-repository multiverse && \
    dpkg --add-architecture i386 && \
    apt update -y && \
    apt-get upgrade -y 
RUN useradd -m steam && cd /home/steam && \
    echo steam steam/question select "I AGREE" | debconf-set-selections && \
    echo steam steam/license note '' | debconf-set-selections && \
    apt purge steam steamcmd && \
    apt install -y gdebi-core  \
                   libgl1-mesa-glx:i386 \
                   wget && \
    apt install -y steam \
                   steamcmd && \
    ln -s /usr/games/steamcmd /usr/bin/steamcmd
RUN apt install -y wine \
                   winbind
RUN apt install -y xserver-xorg \
                   xvfb
RUN rm -rf /var/lib/apt/lists/* && \
    apt clean && \
    apt autoremove -y

RUN apt-get update && apt-get install -y openjdk-8-jdk
RUN apt-get install less
RUN apt-get install groff -y
RUN apt-get install unzip
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install

RUN /usr/bin/steamcmd +@sSteamCmdForcePlatformType windows +force_install_dir $ServerDataPath +login anonymous +app_update 1829350 validate +quit

COPY ServerGameSettings.json "$ServerDataPath/VRisingServer_Data/StreamingAssets/Settings/ServerGameSettings.json"
COPY ServerHostSettings.json "$ServerDataPath/VRisingServer_Data/StreamingAssets/Settings/ServerHostSettings.json"

COPY ServerGameSettings.json "$PersistentDataPath/Settings/ServerGameSettings.json"
COPY ServerHostSettings.json "$PersistentDataPath/Settings/ServerHostSettings.json"

RUN ls $PersistentDataPath

COPY *persistentdata $PersistentDataPath

RUN aws s3 sync "s3://$PersistentDataBucket" $PersistentDataPath --delete

COPY ServerGameSettings.json "$PersistentDataPath/Settings/ServerGameSettings.json"
COPY ServerHostSettings.json "$PersistentDataPath/Settings/ServerHostSettings.json"

COPY backup.sh /backup.sh
RUN chmod +x /backup.sh

COPY logserverpid.sh /logserverpid.sh
RUN chmod +x /logserverpid.sh

COPY start.sh /start.sh
RUN chmod +x /start.sh
CMD ["bash","/start.sh"]