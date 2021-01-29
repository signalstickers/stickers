import axios from 'axios';

import {
  parseErrors,
  parseYaml,
  validate
} from 'lib/test-utils';


/**
 * The maximum number of sticker packs a commit/PR is allowed to remove from the
 * directory.
 */
const MAX_ALLOWED_DELETIONS = 5;


describe('stickers.yml', () => {
  it('should conform to the StickerPackMetadata schema', () => {
    try {
      // This will throw if there are any syntax errors or duplicate
      // key mappings. (ie: duplicate sticker pack IDs).
      const parsedYaml = parseYaml(require.resolve('./stickers.yml'));

      // This will throw if the file is valid YAML but does not conform to our
      // schema.
      if (!validate(parsedYaml)) {
        throw new Error(parseErrors(parsedYaml));
      }
    } catch (err) {
      fail(err);
    }
  });

  it(`should not decrease the number of sticker packs by more than ${MAX_ALLOWED_DELETIONS}`, async () => {
    const existingPartials = (await axios.get('https://signalstickers.github.io/stickers/partials.json')).data;
    const numExistingPacks = existingPartials.length;
    // @ts-expect-error
    const numLocalPacks = Object.keys(parseYaml(require.resolve('./stickers.yml'))).length;
    const packsDiff = numLocalPacks - numExistingPacks;

    if (packsDiff < -MAX_ALLOWED_DELETIONS) {
      fail(`This commit would delete ${Math.abs(packsDiff)} sticker packs, which is  more than the allowed maximum of ${MAX_ALLOWED_DELETIONS}.`);
    }
  });
});
