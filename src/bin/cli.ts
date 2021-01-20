#!/usr/bin/env node

import cli from '@darkobits/saffron';
import compile from 'lib/compile';
import { FetchStickerDataOptions } from 'etc/types';
import log from 'lib/log';


cli.command<FetchStickerDataOptions>({
  command: '*',
  builder: ({ command }) => {
    command.option('input-file', {
      alias: 'i',
      description: 'Input YAML file containing sticker pack ID/key pairs and metadata.',
      type: 'string',
      required: true
    });

    command.option('output-file', {
      alias: 'o',
      description: 'Path where compiled JSON file containing sticker pack partials will be written.',
      type: 'string',
      required: true
    });

    command.option('cache-dir', {
      description: 'Directory where JSON partials will be cached to save bandwidth on future compilations.',
      type: 'string',
      required: false,
      default: '.sticker-partials-cache'
    });
  },
  handler: async ({ argv }) => {
    try {
      await compile(argv);
    } catch (err) {
      log.error(err.message);
      log.verbose(err.stack.split('\n').slice(1).join('\n'));
    }
  }
});


cli.init();
