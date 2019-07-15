import winston, { format } from 'winston';
import 'winston-daily-rotate-file';
import stripAnsi from 'strip-ansi';

const logger = winston.createLogger({
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/processing-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, message }) => `[${timestamp}] ${stripAnsi(message).replace('\n', '')}`),
      ),
    }),
    new winston.transports.Console({
      colorize: true,
      format: format.printf(({ message }) => message),
    }),
  ],
});

export const stubConsole = {
  log: () => {},
  info: () => {},
  error: () => {},
  debug: () => {},
};

const module = {
  console: logger,
  header(header) {
    module.console.info(`\n${header}`);
  },
  info(message) {
    module.console.info(`  ${message}`);
  },
  error(message) {
    module.console.error(`  ${message}`);
  },
  debug(message) {
    module.console.debug(message);
  },
};

export default module;
