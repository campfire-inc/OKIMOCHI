list of environment variable and it's explanation.
These are the one only which is not obvious from its name.

| variable name       | explanation                                                                                                                                                          |
| :---:               | :---:                                                                                                                                                                |
| `APP_NAME`          | name for bot (starts from @)                                                                                                                                         |
| `TOKEN`             | token for slack bot to connect your team                                                                                                                             |
| `DEVELOP_TOKEN`     | if you want to run 2 bots (probably for the sake of development of bot itself.), you can set this variable. It will be used when you specify `NODE_ENV=development`.
|                     |
| `DEFAULT_CHANNEL`   | the channel which the bot sends logging messages                                                                                                                     |
| `EMOJI`             | icon emoji which the bot uses.                                                                                                                                       |
| `BITCOIND_HOST_DIR` | directory which will be specified by `-datadir` option of the bitcoind, specify this is when you want to existing blockchain data in your host machine.
| `MESSAGE_LANG`      | The language that bot speaks. specify either `ja` (for Japanese) or `en` (for english)                                                                                |


