import path from 'path';

import fs from 'fs-extra';
import yaml from 'js-yaml';
import * as R from 'ramda';


function main() {
  const inputFile = process.argv[2];
  const rawInput = fs.readFileSync(path.resolve(inputFile), { encoding: 'utf8' });
  const parsedInput: any = yaml.load(rawInput);
  const reversedInput = R.fromPairs(R.reverse(R.toPairs(parsedInput)));
  const asYamlString = yaml.dump(reversedInput, { indent: 2 });
  fs.writeFileSync(path.resolve('output.yml'), asYamlString);
}


void main();
