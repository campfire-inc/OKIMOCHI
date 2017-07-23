const util = require('util');

const gratitude_to_BTC_map = {
  "感謝": 0.0001,
  "気持ち": 0.0001,
  "きもち": 0.0001,
  "ありがと": 0.0001,
  "thanks": 0.0001,
  "どうも": 0.0001
};

const emoji_to_BTC_map = {
  ":bitcoin:": 0.0001,
  ":pray:": 0.0001,
  ":okimochi:": 0.001,
  ":thankyou1:": 0.0001,
  ":+1:": 0.00001,
  ":bow:": 0.0001
};

module.exports = {
  help: util.format(`
  \`\`\`
  # このhelpメッセージを表示
  - @okimochi-bitcoin help

  # ビットコインをbotにデポジットするためのアドレスを表示
  ## （※ユーザーごとにデポジット額をカウントするので、自分で呼び出したアドレスに振り込むと良い）
  - @okimochi-bitcoin deposit

  # 自身のアドレスの登録
  ## このコマンドの後にアドレスを貼り付けると自動で振り込まれる
  ## 改行を挟めば複数登録できるので多めに登録しておくと吉
  - @okimochi-bitcoin register

  # 現在のBTC-JPYの換算レートを表示
  - @okimochi-bitcoin rate

  # 金額を指定してtip
  ## メッセージはなくても良い。（bitcoinのトランザクションメッセージになる）
  - @okimochi-bitcoin tip @user <BTC amount> <message>

  # ランキングの表示
  ## 1. このbotにデポジットした額
  ## 2. そこから受け取った額
  ## を、チームごとに色分けして表示する。
  - @okimochi-bitcoin ranking


  :bitcoin: や :okimochi: などのリアクションを押すと自動的に支払われるよ！
  反応するボタンは以下
  \`\`\`

  %s
  `, Object.keys(emoji_to_BTC_map).join("\n")),

  message_to_BTC_map: Object.assign(gratitude_to_BTC_map, emoji_to_BTC_map)

}
