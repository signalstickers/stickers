import path from 'path';


import { getStickerPackManifest } from '@signalstickers/stickers-client';
import bytes from 'bytes';
import fs from 'fs-extra';
import gzipSize from 'gzip-size';
import IS_CI from 'is-ci';
import yaml from 'js-yaml';
import pQueue from 'p-queue';
import pRetry from 'p-retry';
import ProgressBar from 'progress';
import * as R from 'ramda';

import {
  StickerPackPartial,
  StickerPackMetadata,
  FetchStickerDataOptions
} from 'etc/types';
import log from 'lib/log';


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
   * Limits concurrency of requests made to the Signal API to avoid throttling.
   */
  const asyncQueue = new pQueue({ concurrency: 6 });

  /**
   * Collection that will represent the final array of StickerPackPartial
   * objects.
   */
  const stickerPackPartials: Array<StickerPackPartial> = [];

  /**
   * Tracks the number of cache hits during the build process.
   */
  let numCacheHits = 0;


  // ----- [1] Determine Cache Location & Create Directory ---------------------

  await fs.ensureDir(options.cacheDir);
  const numCacheEntries = (await fs.readdir(options.cacheDir)).length;

  log.info(`Cache directory: ${log.chalk.green(path.resolve(options.cacheDir))}`);


  // ----- [2] Load Input File -------------------------------------------------

  if (!options.inputFile.endsWith('.yml') && !options.inputFile.endsWith('.yaml')) {
    throw new Error('Input file must be in the YAML format.');
  }

  const absInputFilePath = path.resolve(options.inputFile);
  const stickerPackMetadata = yaml.load(await fs.readFile(absInputFilePath, { encoding: 'utf8' })) as { [key: string]: StickerPackMetadata };
  const allStickerPackIds = R.keys(stickerPackMetadata);

  log.info(`Input file: ${log.chalk.green(absInputFilePath)}.`);


  // ----- [3] Process Metadata ------------------------------------------------

  const estimatedRequestCount = allStickerPackIds.length - numCacheEntries;

  log.info(`Input file contains ${log.chalk.yellow(allStickerPackIds.length)} entries.`);
  log.info(`Cache directory contains: ${log.chalk.yellow(numCacheEntries)} entries.`);

  if (estimatedRequestCount > 0) {
    log.info(`Fetching ${log.chalk.yellow(estimatedRequestCount)} manifests from Signal...`);
  }

  const bar = !IS_CI ? new ProgressBar('[:bar] :current/:total ETA: :eta sec ', {
    width: 92,
    head: '>',
    total: estimatedRequestCount
  }) : undefined;


  /**
   * For each StickerPackMetadata entry:
   *
   * 1. Determine if we have a cached manifest (the data we need from Signal) on
   *    disk for the pack.
   * 2. If not, fetch the manifest data from Signal and cache it to disk, then:
   * 2. Use the cached manifest and metadata to create a StickerPackPartial and
   *    add it to our results array.
   */
  await asyncQueue.addAll(R.map(([id, meta]) => async () => pRetry(async () => {
    let stickerPackManifest: StickerPackPartial['manifest'];

    const candidateSickerPackManifestPath = path.resolve(options.cacheDir, `${id}.json`);

    if (await fs.pathExists(candidateSickerPackManifestPath)) {
      stickerPackManifest = await fs.readJson(candidateSickerPackManifestPath);
      numCacheHits++;
    } else {
      log.silly(`Fetching manifest for sticker pack ${log.chalk.green(id)}.`);

      // Fetch the manifest for the current sticker pack from Signal using its
      // ID and key.
      stickerPackManifest = R.pick([
        'title',
        'author',
        'cover'
      ], await getStickerPackManifest(id, meta.key));

      await fs.writeJson(candidateSickerPackManifestPath, stickerPackManifest);

      bar?.tick();
    }

    // Construct a StickerPackPartial by plucking the title, author, and cover
    // fields from its manifest, then embedding its ID and key into its metadata
    // along with any other metadata fields from the input file.
    const stickerPackPartial: StickerPackPartial = {
      manifest: stickerPackManifest,
      meta: {
        id,
        key: meta.key,
        ...R.omit(['id', 'key'], meta)
      }
    };

    stickerPackPartials.push(stickerPackPartial);
  }, { retries: 2 }), R.toPairs(stickerPackMetadata)));


  // ----- [4] Write Output File -----------------------------------------------

  const absOutputFilePath = path.resolve(options.outputFile);
  log.info(`Writing output file to ${log.chalk.green(absOutputFilePath)}`);

  await fs.ensureDir(path.dirname(absOutputFilePath));
  await fs.writeJSON(absOutputFilePath, stickerPackPartials, { spaces: 2 });
  const gzippedSize = bytes(await gzipSize.file(absOutputFilePath));
  const cacheHitRate = `${Math.floor(numCacheHits / allStickerPackIds.length * 100)}%`;

  log.info(log.prefix('stats'), `Done in ${log.chalk.cyan(runTime)}.`);
  log.info(log.prefix('stats'), `Cache hit rate: ${log.chalk.yellow(cacheHitRate)}`);
  log.info(log.prefix('stats'), `Output file size (gzipped): ${log.chalk.yellow(gzippedSize)}`);
}
