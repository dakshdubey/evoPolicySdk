
import { ConditionParser } from './src/parser/ConditionParser';

console.log('--- Manual Verification ---');

// Regex
const regexPass = ConditionParser.evaluate('~= ^hello$', 'hello');
const regexFail = ConditionParser.evaluate('~= ^hello$', 'bye');
console.log(`Regex Pass: ${regexPass} (Expected true)`);
console.log(`Regex Fail: ${regexFail} (Expected false)`);

// Date
const datePass = ConditionParser.evaluate('> 2023-01-01', '2023-02-01');
const dateFail = ConditionParser.evaluate('< 2023-01-01', '2023-02-01');
console.log(`Date Pass: ${datePass} (Expected true)`);
console.log(`Date Fail: ${dateFail} (Expected false)`);

console.log('--- End ---');
