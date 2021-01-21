import path from 'path';


import { getStickerPackManifest } from '@signalstickers/stickers-client';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import pQueue from 'p-queue';
import pRetry from 'p-retry';
import ProgressBar from 'progress';
import * as R from 'ramda';

import { StickerPackPartial, StickerPackMetadata, FetchStickerDataOptions } from 'etc/types';
import log from 'lib/log';


/**
 * Limits concurrency of requests made to the Signal API to avoid throttling.
 */
const requestQueue = new pQueue({ concurrency: 6 });


/**
 * Queries Signal's Stickers API for each sticker pack enumerated in `inputFile`
 * and creates StickerPackPartial. This object is then cached on disk to improve
 * performance.
 */
export default async function compileStickerPackPartials(options: Required<FetchStickerDataOptions>) {
  /**
   * Tracks how long the task takes to complete.
   */
  const runTime = log.createTimer();

  /**
   * Collection that will represent the final array of StickerPackPartial
   * objects.
   */
  const stickerPackPartials: Array<StickerPackPartial> = [];

  /**
   * Stores the IDs and StickerPackMetadata for each sticker pack that we didn't
   * have a cached StickerPackPartial for. This will be used as the source of
   * truth for each query we will make to Signal.
   */
  const requests = new Map<string, StickerPackMetadata>();

  /**
   * Tracks the number of cache hits during the build process.
   */
  let numCacheHits = 0;


  // ----- [1] Determine Cache Location & Create Directory ---------------------

  // const cacheDirectory = options.cacheDir;
  await fs.ensureDir(options.cacheDir);
  log.info(`Cache directory: ${log.chalk.green(path.resolve(options.cacheDir))}`);


  // ----- [2] Load Input File -------------------------------------------------

  if (!options.inputFile.endsWith('.yml') && !options.inputFile.endsWith('.yaml')) {
    throw new Error('Input file must be in the YAML format.');
  }

  const absInputFilePath = path.resolve(options.inputFile);
  const rawInputFileContents = await fs.readFile(absInputFilePath, { encoding: 'utf8' });
  log.info(`Input file: ${log.chalk.green(absInputFilePath)}.`);

  const stickerPackMetadata = yaml.load(rawInputFileContents) as { [key: string]: StickerPackMetadata };
  const keys = Object.keys(stickerPackMetadata);
  log.info(`Input file contains ${log.chalk.yellow(keys.length)} entries.`);


  // ----- [3] Load Cached Sticker Pack Partials -------------------------------

  /**
   * Map over each id -> StickerPackMetadata entry from the input file and
   * determine if we have a cached StickerPackPartial for it.
   */
  await Promise.all(R.map(async ([id, meta]) => {
    const candidateSickerPackPartialPath = path.resolve(options.cacheDir, `${id}.json`);

    if (await fs.pathExists(candidateSickerPackPartialPath)) {
      // If we have a cached StickerPackPartial, load it and add it to the
      // results array. In this case, we don't need the metadata object loaded
      // from the input file because it will already be present in the cached
      // StickerPackPartial.
      const stickerPackPartial = await fs.readJson(candidateSickerPackPartialPath);
      stickerPackPartials.push(stickerPackPartial);
      numCacheHits++;
    } else {
      // If we do not have a cached StickerPackPartial, add the sticker pack's
      // ID and metadata to our query
      // Otherwise, add the current ID and metadata to our 'cache misses' array.
      requests.set(id, meta);
    }
  }, R.toPairs(stickerPackMetadata)));

  const cacheHitRate = `${Math.round(numCacheHits / keys.length * 100)}%`;
  log.info(`Cache contains ${log.chalk.yellow(numCacheHits)} entries. (${cacheHitRate} cache hit rate)`);


  // ----- [4] Fetch Manifests From Signal -------------------------------------

  if (requests.size > 0) {
    log.info(`Fetching manifests for ${log.chalk.yellow(requests.size)} sticker packs...`);
  }

  const bar = new ProgressBar('[:bar] :current/:total ETA: :eta sec ', {
    width: 92,
    head: '>',
    total: requests.size
  });

  await requestQueue.addAll(R.map(([id, meta]) => async () => pRetry(async () => {
    log.silly(`Fetching manifest for sticker pack ${log.chalk.green(id)}.`);

    // Fetch the manifest for the current sticker pack from Signal using its
    // ID and key.
    const manifest = await getStickerPackManifest(id, meta.key);

    // Construct a StickerPackPartial by plucking the title, author, and cover
    // fields from its manifest, then embedding its ID and key into its metadata
    // along with any other metadata fields from the input file.
    const stickerPackPartial: StickerPackPartial = {
      manifest: R.pick([
        'title',
        'author',
        'cover'
      ], manifest),
      meta: {
        id,
        key: meta.key,
        ...R.omit(['id', 'key'], meta)
      }
    };

    // Write the StickerPackPartial as an individual JSON file to our cache
    // directory.
    await fs.writeJson(path.resolve(options.cacheDir, `${id}.json`), stickerPackPartial);

    stickerPackPartials.push(stickerPackPartial);

    bar.tick();
  }, { retries: 2 }), [...requests.entries()]));


  // ----- [5] Write Output File -----------------------------------------------

  // Sort partials in the output according to their position in the input file.
  const sortedStickerPackPartials = R.reduce((acc, cur) => R.insert(
    // Compute the new index for this partial based on its position in the
    // input file.
    R.indexOf(R.path(['meta', 'id'], cur), keys),
    cur,
    acc
  ), [] as Array<StickerPackPartial>, stickerPackPartials);

  const absOutputFilePath = path.resolve(options.outputFile);
  log.info(`Writing output file to ${log.chalk.green(absOutputFilePath)}`);
  await fs.ensureDir(path.dirname(absOutputFilePath));
  await fs.writeJSON(absOutputFilePath, sortedStickerPackPartials, { spaces: 2 });

  // Compute and log output file size here.
  log.info(`Done. ${log.chalk.dim(`(${runTime})`)}`);
}
