
const BitcoindClient = require("bitcoin-core");
const bitcoindclient = new BitcoindClient(config.bitcoin);


const batch = [
  {
    method: importaddress,
    params: ["address", "comment", false]
  }
]
