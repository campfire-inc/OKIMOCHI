#!/usr/bin/env bash
set -ux
docker network create -d bridge --subnet 182.0.0.0/24 --gateway 182.0.0.1 ci
docker-compose -f docker-compose.test.yml -p ci build okimochi
docker-compose -f docker-compose.test.yml -p ci run --rm okimochi
docker-compose -f docker-compose.test.yml -p ci down

