#!/usr/bin/env node

const { Command } = require('commander');
const { run } = require('../src/index');

const program = new Command();

program
  .name('lark-req-prototype')
  .description('Read Feishu requirement docs, generate HTML prototypes and SRS documents with embedded screenshots')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate prototypes and SRS from a Feishu document')
  .requiredOption('--doc <url_or_token>', 'Feishu document URL or token')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('--step <step>', 'Execution step: all, fetch, prototype, screenshot, srs', 'all')
  .option('--upload', 'Upload results to Feishu', false)
  .option('--srs-doc <doc_id>', 'Feishu doc ID to upload SRS to')
  .option('--as-bot', 'Use bot identity', true)
  .option('--version <version>', 'SRS document version', '1.0')
  .action(async (opts) => {
    try {
      await run({
        docUrl: opts.doc,
        outputDir: opts.output,
        step: opts.step,
        upload: opts.upload,
        srsDocId: opts.srsDoc,
        asBot: opts.asBot,
        version: opts.version,
      });
    } catch (e) {
      console.error('Error:', e.message);
      process.exit(1);
    }
  });

program
  .command('screenshot')
  .description('Capture screenshots of existing HTML prototypes')
  .requiredOption('-i, --input <dir>', 'Prototype directory containing HTML files')
  .option('-o, --output <dir>', 'Output directory for screenshots', './output/screenshots')
  .action(async (opts) => {
    try {
      await run({
        screenshotOnly: true,
        screenshotDir: opts.input,
        outputDir: path.dirname(opts.output),
      });
    } catch (e) {
      console.error('Error:', e.message);
      process.exit(1);
    }
  });

program.parse();
