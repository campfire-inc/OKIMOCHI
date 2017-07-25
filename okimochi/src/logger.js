const winston = require("winston");

const logLevel = (process.env.NODE_ENV === "development") ? 'debug' : 'info';

const logger = new winston.Logger({
  level: logLevel,
  transports: [
    new (winston.transports.Console)({colorize: true, timestamp: true}),
    // new (winston.transports.File)({ filename: './okimochi.log'})
  ]
})

module.exports = logger;
