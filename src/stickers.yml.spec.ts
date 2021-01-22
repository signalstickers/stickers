import {
  parseErrors,
  parseYaml,
  validate
} from 'lib/test-utils';
// import log from 'lib/log';


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
});
