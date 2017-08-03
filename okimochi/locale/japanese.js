const path = require('path');
const util = require('util');
const lib = require(path.join(__dirname, '..', 'src', 'lib'));
const config = require(path.join(__dirname, '..', 'config'))

const inSatoshi = lib.inSatoshi;
const btc2jpy = lib.btc2jpy;

const gratitude_to_BTC_map = {
  "感謝": 0.0001,
  "気持ち": 0.0001,
  "きもち": 0.0001,
  "ありがと": 0.0001,
  "thanks": 0.0001,
  "どうも": 0.0001
};

const emoji_to_BTC_map = {
  ":bitcoin:": 0.0005,
  ":pray:": 0.0005,
  ":okimochi:": 0.003,
  ":thankyou1:": 0.0005,
  ":+1:": 0.0001,
  ":bow:": 0.0005,
  ":congratulations:": 0.0005,
  ":100:": lib.jpy2btc(100),
  ":azaas:": 0.001,
  ":bitoko:": 0.001,
  ":dekiru:": 0.0001,
  ":ga-sas:": 0.0001,
  ":hayai:": 0.0001,
  ":kami-taiou:": 0.0006,
  ":kawaii:": 0.0001,
  ":kekkon:": 0.0001,
  ":kawaii:": 0.0001,
  ":sugoi:": 0.0001,
  ":suki:": 0.0001,
  ":suko:": 0.0001,
  ":yoi:": 0.0001,
  ":you_know:": 0.0005,
  ":yuunou:": 0.0001,
  ":zass:": 0.0005,
};

let emoji_info = []
for (k of Object.keys(emoji_to_BTC_map)){
  let btc = emoji_to_BTC_map[k]
  emoji_info.push([k, btc + "BTC", inSatoshi(btc) + "Satoshi", btc2jpy(btc) + "円"])
}


module.exports = {
  help: `
  \`\`\`
  # このhelpメッセージを表示
  - ${config.APP_NAME} help

  # ビットコインをbotにデポジットするためのアドレスを表示
  ## （※ユーザーごとにデポジット額をカウントするので、自分で呼び出したアドレスに振り込むと良い）
  - ${config.APP_NAME} deposit

  # 支払い保留中のビットコインの額を確認(registerすれば不要)
  - ${config.APP_NAME} pendingBalance

  # 支払い保留中のビットコインの引き出し(registerすれば不要)
  - ${config.APP_NAME} withdraw

  # 自身のアドレスの登録
  ## このコマンドの後にbotが振込先アドレスを聞いてくるので、貼り付けると自動で振り込まれる
  ## 改行を挟めば複数登録できるので多めに登録しておくと吉
  - ${config.APP_NAME} register

  # depositされ、まだ誰にも支払われていない額の合計
  - ${config.APP_NAME} totalBalance

  # 現在のBTC-JPYの換算レートを表示
  - ${config.APP_NAME} rate

  # 金額を指定してtip
  ## メッセージはなくても良い。（bitcoinのトランザクションメッセージになる）
  - ${config.APP_NAME} tip @user <BTC amount> <message>

  # ランキングの表示
  ## 1. このbotにデポジットした額
  ## 2. そこから受け取った額
  ## を、チームごとに色分けして表示する。
  - ${config.APP_NAME} ranking


  :bitcoin: や :okimochi: などのリアクションを押すと自動的に支払われるよ！
  反応するボタンは以下
  \`\`\`

  ${emoji_info.join("\n")}
  `,

  message_to_BTC_map: Object.assign(gratitude_to_BTC_map, emoji_to_BTC_map),
  cannot_pay: `%sから%sBTCのOKIMOCHIをもらいました！` +
  `が、ビットコインアドレスを登録していないので、支払いはOKIMOCHI内で保留しています。
  ビットコインを本当にあなたのものにしたい場合は以下の手順を踏んでください。
  1. \`${config.APP_NAME} pendingBalance \` で保留されているビットコインの額を確認
  2. \`${config.APP_NAME} withdraw\` で自身のビットコインアドレスに送金
  3. \`${config.APP_NAME} register\` でビットコインアドレスを登録することで、次回から自動でここに送金（任意）
    * \`register\` で登録する場合は、可能なら改行で区切って複数登録しておくことをお勧めします。

  \`${config.APP_NAME} help\` でより詳しい情報が手に入ります。
  `,
  allPaybackAddressUsed: `注意: registerされたアドレスが全て使用済みになりました。
  fungibility確保のため、アドレスはトランザクションごとに使い分けることが奨励されています。
  気が向いたら、多めに登録しておきましょう。
`,
  needMoreDeposit: "depositされた額が底をついたため、支払えません :(",
  totalBalance: "壺に残っている額は現在%s BTCです。",
  ranking:{
    xaxis: "depositした量",
    yaxis: "受け取った量",
  },
  tell_payment_success_to_tipper: "tipしました！",
  pendingBalance: "あなたが引き出せる金額は %s BTCです",
  deposit: {
    msg_with_qrcode: "このアドレスに振り込んでください（QRコードも同じアドレスです）",
    file_comment: "同じアドレスのQRコード表現です"
  },
  register: {
    beg: "%sのBTCアドレスを入力してください（改行を入れて複数可）",
    success: "%sの支払先アドレスを登録しました！",
    notValid: "有効なビットコインアドレスを入力してください！"
  },
  withdraw: {
    Ask: "いくら引き出しますか？",
    amountMustBeNumber: "BTCの額を半角数字で入力してください！",
    notEnoughPendingBalance: `あなたが引き出せる額を超えています！
      最大額は \`${config.APP_NAME} pendingBalance\` で確認できます！`,
    pasteAddress: "送金先ビットコインアドレスを貼り付けてください",
    successfulPayment: "送金しました！",
    sent: "送金を受け付けました。自動で送金を試みます。"
  },
}
