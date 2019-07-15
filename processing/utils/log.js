export const stubConsole = {
  log: () => {},
  info: () => {},
  error: () => {},
  debug: () => {},
};

const module = {
  console,
  header(header) {
    module.console.log(`\n${header}`);
  },
  info(message) {
    module.console.info(`    ${message}`);
  },
  log(message) {
    module.console.log(`    ${message}`);
  },
  error(message) {
    module.console.error(`    ${message}`);
  },
  debug(message) {
    module.console.debug(message);
  },
};

export default module;
