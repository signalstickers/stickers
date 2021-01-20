<a href="https://signalstickers.com" id="top">
  <img src="https://user-images.githubusercontent.com/441546/105129971-02e62500-5a9b-11eb-88f5-21065084e25d.png" style="max-width: 100%;" />
</a>
<p align="center">
  <a href="https://github.com/signalstickers/stickers/actions"><img src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Fsignalstickers%2Fstickers%2Fbadge%3Fref%3Dmaster&style=flat-square&label=build&logo=none"></a>
  <a href="https://github.com/signalstickers/signalstickers/graphs/contributors"><img src="https://img.shields.io/github/contributors/signalstickers/signalstickers"></a>
  <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/"><img src="https://img.shields.io/static/v1?label=license&message=CC-BY-NC-4.0&style=flat-square&color=398AFB"></a>
  <a href="https://twitter.com/signalstickers"><img src="https://img.shields.io/twitter/follow/signalstickers?label=Feed&style=social"></a>
</p>

This repository contains a manifest that serves as the source of truth for all
sticker packs in the signalstickers.com directory, as well as a CLI that
transforms the manifest by augmenting each entry with data fetched from Signal's
Sticker API. The transformed file is hosted on GitHub pages where it is
consumed by [signalstickers.com](https://signalstickers.com).

## CLI

This repository contains the source for a CLI that is responsible for ingesting
a YAML file containing a mapping of sticker pack IDs (`strings`) to [`StickerPackMetadata`](https://github.com/signalstickers/stickers/blob/master/src/etc/types.ts#L8-L25)
objects and outputting a JSON file containing an array of [`StickerPackPartial`](https://github.com/signalstickers/stickers/blob/master/src/etc/types.ts#L39-L55)
objects.

The API for the CLI is as follows:

```
> compile-stickers --help

Compile sticker pack metadata and manifests to sticker pack partials.

Options:
  -i, --input-file          Input YAML file containing sticker pack ID/key pairs and metadata.
  -o, --output-file         Path where compiled JSON file containing sticker pack partials
                            will be written.
      --cache-dir           Directory where JSON partials will be cached to save bandwidth on
                            future compilations.
  -v, --version, --version  Show version number
  -h, --help, --help        Show help
```

## Testing & Continuous Integration

The CI job for this repository validates [`stickers.yml`](src/stickers.yml)
against a [JSON schema](/src/etc/schema.ts) using AJV, then uses the above CLI
to compile this data (in addition to data from Signal) to a JSON file that is
published to the [`gh-pages`](/tree/gh-pages) branch for consumption by
[signalstickers.com](https://signalstickers.com). Each entry is cached on disk
to keep build times fast and ensures that we only make a request to Signal the
first time a new sticker pack is added to the directory.

## License & Usage

Under no circumstances shall the data contained in `stickers.yml` (or its
derivatives) be used for commercial purposes. This includes but is not limited
to any website, application, or other software that utilizes this data and
additionally serves advertisements, tracks its users and subsequently sells that
data to third parties, or otherwise employs similarly unscrupulous monetization
schemes of questionable morality. Usage of this data is permitted, provided the
software that consumes it be provided free of charge and collects no data about
the users of said software that can then be monetized. Furthermore, any software
that makes use of the data contained herein is obligated to license the data
and any modifications thereto or derivatives thereof under the Creative Commons
Attribution Non-Commercial 4.0 license. For more information, see the
[LICENSE](/LICENSE) copy.
