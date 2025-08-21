import chalk from 'chalk';
export const log = {
  info: (...a) => console.log(chalk.cyan('[INFO]'), ...a),
  warn: (...a) => console.warn(chalk.yellow('[WARN]'), ...a),
  error: (...a) => console.error(chalk.red('[ERROR]'), ...a),
  ready: (...a) => console.log(chalk.green('[READY]'), ...a)
};
