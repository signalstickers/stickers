## CLI

This repository contains the source for a CLI that is responsible for ingesting
a YAML file containing a mapping of sticker pack IDs (`strings`) to
[`StickerPackMetadata`](https://github.com/signalstickers/stickers/blob/master/src/etc/types.ts#L8-L25)
objects and outputting a JSON file containing an array of
[`StickerPackPartial`](https://github.com/signalstickers/stickers/blob/master/src/etc/types.ts#L39-L55)
objects.

The API for the CLI is as follows:

```
> compile-stickers --help

Compile sticker pack metadata and manifests to sticker pack partials.

Options:
  -i, --input-file          Input YAML file containing sticker pack ID/key pairs
                            and metadata.
  -o, --output-file         Path where compiled JSON file containing sticker
                            pack partials will be written.
      --cache-dir           Directory where JSON partials will be cached to save
                            bandwidth on future compilations.
  -v, --version, --version  Show version number.
  -h, --help, --help        Show help.
```

## Testing & Continuous Integration

The CI job for this repository validates [`stickers.yml`](src/stickers.yml)
against a [JSON schema](/src/etc/schema.ts) using AJV, then builds the above CLI
and uses it to compile this data (in addition to data from Signal) to a JSON
file that is published to the [`gh-pages`](/tree/gh-pages) branch for
consumption by [signalstickers.com](https://signalstickers.com). Each entry is
cached on disk to keep build times fast and ensures that we only make a request
to Signal the first time a new sticker pack is added to the directory.
