const fs = require('fs');
const path = require('path');
const { fetchDocument, parseRequirementStructure } = require('./doc-reader');
const { generatePrototypes } = require('./prototype-generator');
const { captureScreenshots } = require('./screenshot-capture');
const { generateSRS, saveSRS } = require('./srs-generator');
const { uploadScreenshots, uploadSRSToFeishu, uploadPrototypeToFeishu } = require('./uploader');

async function run(options = {}) {
  const {
    docUrl,
    outputDir = './output',
    step = 'all',
    screenshotOnly = false,
    screenshotDir: inputScreenshotDir,
    upload = false,
    srsDocId,
    asBot = true,
    version = '1.0',
  } = options;

  const absOutputDir = path.resolve(outputDir);
  fs.mkdirSync(absOutputDir, { recursive: true });

  console.log('========================================');
  console.log('  lark-req-prototype');
  console.log('  Feishu Doc → Prototype + SRS Generator');
  console.log('========================================\n');

  if (screenshotOnly && inputScreenshotDir) {
    console.log('[main] Screenshot-only mode\n');
    const prototypeDir = path.resolve(inputScreenshotDir);
    const ssDir = path.join(absOutputDir, 'screenshots');
    const screenshots = await captureScreenshots(prototypeDir, ssDir);
    console.log(`\n[main] Done! ${screenshots.length} screenshots captured.`);
    return { screenshots };
  }

  if (!docUrl) {
    throw new Error('Document URL or token is required. Use --doc <url_or_token>');
  }

  console.log(`[main] Document: ${docUrl}`);
  console.log(`[main] Output: ${absOutputDir}`);
  console.log(`[main] Step: ${step}\n`);

  let docData = null;
  let structure = null;
  let prototypeFiles = null;
  let screenshots = [];
  let srsPath = null;

  if (step === 'all' || step === 'fetch' || step === 'prototype' || step === 'srs') {
    console.log('--- Step 1: Fetching document ---');
    docData = await fetchDocument(docUrl, { asBot });
    console.log(`[main] Document title: ${docData.title}`);
    console.log(`[main] Content length: ${docData.markdown.length} chars\n`);

    console.log('--- Step 2: Parsing requirement structure ---');
    structure = parseRequirementStructure(docData.markdown);
    console.log(`[main] Project: ${structure.projectName}`);
    console.log(`[main] Modules: ${structure.modules.length}`);
    for (const mod of structure.modules) {
      console.log(`[main]   - ${mod.name} (${mod.type}): ${mod.features.length} features`);
    }
    console.log('');

    const structurePath = path.join(absOutputDir, 'structure.json');
    fs.writeFileSync(structurePath, JSON.stringify(structure, null, 2), 'utf8');
    console.log(`[main] Structure saved: ${structurePath}\n`);
  }

  if (step === 'all' || step === 'prototype') {
    console.log('--- Step 3: Generating prototypes ---');
    prototypeFiles = generatePrototypes(structure, absOutputDir);
    console.log(`[main] Mobile prototype: ${prototypeFiles.mobile || 'N/A'}`);
    console.log(`[main] Admin prototype: ${prototypeFiles.admin || 'N/A'}\n`);
  }

  if (step === 'all' || step === 'screenshot') {
    console.log('--- Step 4: Capturing screenshots ---');
    const prototypeDir = path.join(absOutputDir, 'prototype');
    if (fs.existsSync(prototypeDir)) {
      const ssDir = path.join(absOutputDir, 'screenshots');
      screenshots = await captureScreenshots(prototypeDir, ssDir);
      console.log(`[main] Screenshots: ${screenshots.length}\n`);
    } else {
      console.log('[main] No prototype directory found, skipping screenshots\n');
    }
  }

  if (step === 'all' || step === 'srs') {
    console.log('--- Step 5: Generating SRS ---');
    if (!structure && docData) {
      structure = parseRequirementStructure(docData.markdown);
    }
    if (!screenshots || screenshots.length === 0) {
      const ssDir = path.join(absOutputDir, 'screenshots');
      if (fs.existsSync(ssDir)) {
        const files = fs.readdirSync(ssDir).filter((f) => f.endsWith('.png'));
        screenshots = files.map((f) => ({
          name: f.replace('.png', '').replace(/-/g, ' '),
          file: f,
          path: path.join(ssDir, f),
          type: f.startsWith('admin') ? 'admin' : 'mobile',
        }));
      }
    }

    const srsContent = generateSRS(structure, screenshots, { version });
    srsPath = saveSRS(srsContent, absOutputDir);
    console.log(`[main] SRS generated: ${srsPath}\n`);
  }

  if (upload) {
    console.log('--- Step 6: Uploading to Feishu ---');

    if (screenshots.length > 0 && srsDocId) {
      console.log('[main] Uploading screenshots...');
      const uploadResults = await uploadScreenshots(screenshots, srsDocId, { asBot });
      console.log(`[main] Screenshots uploaded: ${uploadResults.filter((r) => r.status === 'ok').length}/${uploadResults.length}\n`);
    }

    if (srsPath) {
      console.log('[main] Uploading SRS...');
      const srsResult = await uploadSRSToFeishu(srsPath, {
        docId: srsDocId,
        title: `需求规格说明书 - ${structure?.projectName || ''}`,
        asBot,
      });
      if (srsResult.ok) {
        console.log(`[main] SRS uploaded. Doc ID: ${srsResult.docId}\n`);
      }
    }

    if (prototypeFiles) {
      const prototypeDir = path.join(absOutputDir, 'prototype');
      console.log('[main] Uploading prototypes...');
      const protoResults = await uploadPrototypeToFeishu(prototypeDir, {
        title: `原型 - ${structure?.projectName || ''}`,
        asBot,
      });
      console.log(`[main] Prototypes uploaded: ${protoResults.filter((r) => r.status === 'ok').length}/${protoResults.length}\n`);
    }
  }

  console.log('========================================');
  console.log('  Generation Complete!');
  console.log('========================================');
  console.log(`  Output: ${absOutputDir}`);
  if (prototypeFiles?.mobile) console.log(`  Mobile Prototype: ${prototypeFiles.mobile}`);
  if (prototypeFiles?.admin) console.log(`  Admin Prototype: ${prototypeFiles.admin}`);
  console.log(`  Screenshots: ${screenshots.length}`);
  if (srsPath) console.log(`  SRS Document: ${srsPath}`);
  console.log('========================================\n');

  return {
    structure,
    prototypeFiles,
    screenshots,
    srsPath,
  };
}

module.exports = { run };
