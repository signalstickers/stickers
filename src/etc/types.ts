import type { StickerPackManifest } from '@signalstickers/stickers-client';


/**
 * A sticker pack's "metadata" is an object containing its ID and decryption key
 * as well as any other information that does _not_ come from the Signal API.
 */
export interface StickerPackMetadata {
  /**
   * 32-character alphanumeric string.
   */
  id: string;

  /**
   * 64-character alphanumeric string required to decrypt responses from Signal.
   */
  key: string;

  /**
   * All other fields in the metadata object are freeform key/value pairs that
   * will be copied into the "meta" key of the StickerPackPartial created for
   * each pack.
   */
  [key: string]: any;
}


/**
 * A sticker pack "partial" is an object with (2) keys:
 *
 * 1. "manifest" - Partial set of fields from the pack's manifest that this
 *    plugin fetches from Signal at build-time.
 * 2. "meta" - Object containing the pack's ID and decryption key, as well as
 *    any additional data in from the input file associated with the pack.
 *
 * This plugin will add a JSON file to the Webpack compilation that will be an
 * array of StickerPackPartial objects.
 */
export interface StickerPackPartial {
  /**
   * This object is identical to a sticker pack's manifest, but omits the
   * 'stickers' key, as we do not need it at build-time for indexing/searching.
   */
  manifest: {
    title: StickerPackManifest['title'];
    author: StickerPackManifest['author'];
    cover: StickerPackManifest['cover'];
  };

  /**
   * This object will contain the pack's ID, decryption key, and any other keys
   * from this pack's entry in the input file.
   */
  meta: StickerPackMetadata;
}


/**
 * Options object accepted by fetchStickerData.
 */
export interface FetchStickerDataOptions {
  /**
   * Path to a YAML file containing an object mapping sticker pack IDs to
   * StickerPackMetadata objects.
   */
  inputFile: string;

  /**
   * Path where a JSON file will be written containing an array of
   * StickerPackPartial objects.
   */
  outputFile: string;

  /**
   * Optional path to the directory where intermediate StickerPackPartial JSON
   * files will be written. When building the output file, this directory will
   * be checked for a pre-compiled StickerPackPartial object before querying
   * the Signal API.
   *
   * Default: ./.sticker-pack-cache
   */
  cacheDir: string;
}
