

## How to deploy

```
cp .env_example .env # modify .env with your own slack bot token
docker network create -d bridge --subnet 192.168.0.0/24 --gateway 192.168.0.1 okimochi
docker-compose up
```
