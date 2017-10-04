# OKIMOCHI

An user-friendly micro payment platform working as a slack bot.

## What is OKIMOCHI?

It consists of 3 containers

1. `okimochi` ... app itself
2. `mongo` ... mongodb which contains user information
3. `bitcoind` ... bitcoind

2 and 3 are optional, you can specify your own bitcoind instance by configuring `BITCOIND_URI` environment variable  in `.env`

## How to run all 3 containers in local

```
cp .env_example .env # modify .env with your own slack bot token
```

there are lots of environment variable you can configure, but the one most importtant is `TOKEN`,
which you can get when you register bot uesr into your team.
Or otherwise you can get when you register your app from `Authentication` in the buttom of [this page](https://api.slack.com/web).

see document for [detailed explanation](./doc/env.md) about environment variable.

```
docker network create -d bridge --subnet 172.0.0.0/24 --gateway 172.0.0.1 okimochi-network
docker-compose --build up
```

## use remote bitcoind.

please edit `BITCOIND_URI`, `BITCOIND_USERNAME`, `BITCOIND_PASSWORD`, in `.env`,
check there is no inconsistency in `docker-compose.yml`,
and run

```
docker-compose up --build mongo okimochi
```

<<<<<<< Updated upstream
=======
## how to run test.

`./test.sh` for running test.
test suite is far from complete and may contain bugs. We appreciate for PR adding new tests.

>>>>>>> Stashed changes
## How to contribute

see [TODO](https://github.com/campfire-inc/OKIMOCHI/issues/1)
and give a PR to develop branch.
