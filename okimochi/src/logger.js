const winston = require("winston");

const logLevel = (process.env.NODE_ENV === "development") ? 'debug' : 'info';

winston.loggers.add("okimochi", {
  console: {
    level: logLevel,
    colorize: true,
    label : "okimochi-logger"
  }
})

winston.loggers.add('botkit', {
  console: {
    level: "info",
    colorize: false,
  }
})

