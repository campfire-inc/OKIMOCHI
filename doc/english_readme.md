# OKIMOCHI

An user-friendly micro payment app working as a slack bot.

OKIMOCHI stands for *gratitude* in japanese.

This bot is still in alpha state, use as your own responsibility.

Especially be careful to use only in trusted members since it is possible to steal almost whole deposited balance
if more than two people have conspired.
So it is recommended to not deposit too much amount at once.

## What is it?

It is a bot for tipping the bitcoin to each other on Slack. You must first deposit to shared pot by `deposit` command.
And you can tip to others by reacting by slack button(or use `tip` command to manually tip). type `help` to this bot in direct message for more detail.

## How it works?

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

## how to run test.

`./test.sh` for running test.
test suite is far from complete and may contain bugs. We appreciate for PR adding new tests.

## How to contribute

see [TODO](https://github.com/campfire-inc/OKIMOCHI/issues/1)
and give a PR to develop branch.
