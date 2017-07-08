from node:7.10
MAINTAINER Joe Miyamoto <joemphilips@gmail.com>

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app


RUN set -e \
    && apt-get update && apt-get upgrade -y

RUN set -e \
    && apt-get install --yes \
        --no-install-recommends \ 
        build-essential g++ python2.7 python2.7-dev unzip curl jq

RUN mkdir -p /tmp \
    && cd /tmp \
    && curl -O https://bootstrap.pypa.io/get-pip.py \
    && python get-pip.py \
    && pip install awscli \
    && rm -f /tmp/get-pip.py

RUN curl -fsSLO https://get.docker.com/builds/Linux/x86_64/docker-17.04.0-ce.tgz \
  && tar xzvf docker-17.04.0-ce.tgz \
  && mv docker/docker /usr/local/bin \
  && rm -r docker docker-17.04.0-ce.tgz

RUN set -e \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

