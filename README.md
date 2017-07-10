# OKIMOCHI

the user friendly micro payment platform working on the slack

## What is OKIMOCHI?

## How to run in local

```
cp .env_example .env # modify .env with your own slack bot token
docker network create -d bridge --subnet 172.0.0.0/24 --gateway 172.0.0.1 okimochi-network
docker-compose --build up
```



## How to contribute

see [TODO](https://github.com/campfire-inc/OKIMOCHI/issues/1)
and give a PR to develop branch.
