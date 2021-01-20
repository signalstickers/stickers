import fs from 'fs';

import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import betterAjvErrors from 'better-ajv-errors';
import yaml from 'js-yaml';

import schema from 'etc/schema';


/**
 * @private
 *
 * AJV instance with ajv-errors installed.
 */
const ajv = new Ajv({ allErrors: true });
ajvErrors(ajv);


/**
 * Validator function for the above schema.
 */
export const validate = ajv.compile(schema);


/**
 * Function that accepts an input object and returns a string suitable for
 * printing to the console which describes each error in the input object.
 */
export function parseErrors(input: any) {
  const output = betterAjvErrors(schema, input, validate.errors, { indent: 2 });

  if (output) {
    return output.toString();
  }

  throw new Error('An error occurred while parsing errors #meta.');
}


/**
 * Provided a path to a YAML file, loads the file, parses it, and returns a
 * JavaScript data structure. If the file is not valid YAML or contains a
 * syntax error, an error will be thrown.
 */
export function parseYaml(inputFilePath: string) {
  return yaml.load(fs.readFileSync(inputFilePath, { encoding: 'utf8' }));
}
