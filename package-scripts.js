module.exports = require('@darkobits/ts').nps({
  scripts: {
    compile: 'npx compile-stickers --input-file src/stickers.yml --output-file partials/partials.json'
  }
});
