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

  # 支払い保留中のビットコインの額を確認(registerすれば不要)
  - @okimochi-bitcoin pendingBalance

  # 支払い保留中のビットコインの引き出し(registerすれば不要)
  - @okimochi-bitcoin withdraw

  # 自身のアドレスの登録
  ## このコマンドの後にbotが振込先アドレスを聞いてくるので、貼り付けると自動で振り込まれる
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

  message_to_BTC_map: Object.assign(gratitude_to_BTC_map, emoji_to_BTC_map),
  cannot_pay: ` はビットコインアドレスを登録していないので、支払いはOKIMOCHI内で保留しています！
  ビットコインを本当にあなたのものにしたい場合は以下の手順を踏んでください！
  1. \`@okimochi-bitcoin pendingBalance \` で保留されているビットコインの額を確認
  2. \`@okimochi-bitcoin withdraw\` で自身のビットコインアドレスに送金
  3. \`@okimochi-bitcoin register\` でビットコインアドレスを登録することで、次回から自動でここに送金（任意）
    * \`register\` で登録する場合は、可能なら改行で区切って複数登録しておくことをお勧めします。
  `,
  allPaybackAddressUsed: `注意: registerされたアドレスが全て使用済みになりました。
  fungibility確保のため、アドレスはトランザクションごとに使い分けることが奨励されています。
  気が向いたら、多めに登録しておきましょう。
`,
  pendingBalance: "あなたが引き出せる金額は %s BTCです",
  deposit: {
    msg_with_qrcode: "このアドレスに振り込んでください（QRコードも同じアドレスです）",
   file_comment: "同じアドレスのQRコード表現です"
  },
  register: {
    beg: "%sのBTCアドレスを入力してください（改行を入れて複数可）",
    success: "%sの支払先アドレスを登録しました！"
  },
  withdraw: {
    Ask: "いくら引き出しますか？",
    amountMustBeNumber: "BTCの額を半角数字で入力してください！",
    notEnoughPendingBalance: `あなたが引き出せる額を超えています！
      最大額は \`@okimochi-bitcoin pendingBalance\` で確認できます！`,
    pasteAddress: "送金先ビットコインアドレスを貼り付けてください",
    successfulPayment: "送金しました！",
    sent: "送金を受け付けました。自動で送金を試みます。"
  },
}
