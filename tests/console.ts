import chalk = require("chalk");


const LINE_DELIMITER  = "=====================================";
const TEXT_PASS       = "                PASS                 ";
const TEXT_FAIL       = "                FAIL                 ";


function printSuccessMsg() {
  console.log(`${chalk.greenBright(LINE_DELIMITER)}`);
  console.log(`${chalk.greenBright(TEXT_PASS)}`);
  console.log(`${chalk.greenBright(LINE_DELIMITER)}`);
}

function printFailMsg() {
  console.log(`${chalk.red(LINE_DELIMITER)}`);
  console.log(`${chalk.red(TEXT_FAIL)}`);
  console.log(`${chalk.red(LINE_DELIMITER)}`);
}

export = {
  printSuccessMsg: printSuccessMsg,
  printFailMsg: printFailMsg,
};