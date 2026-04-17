const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCmd(cmd, cwd) {
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
      timeout: 300000,
      cwd: cwd || process.cwd(),
    });
    return { ok: true, data: result };
  } catch (e) {
    return { ok: false, error: (e.stdout || '') + (e.stderr || '') };
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function uploadScreenshots(screenshots, docId, options = {}) {
  const cwd = options.cwd || process.cwd();
  const asBot = options.asBot !== false;
  const asFlag = asBot ? ' --as bot' : '';
  const results = [];

  for (const ss of screenshots) {
    console.log(`[uploader] Uploading: ${ss.name} (${ss.file})`);

    const cmd = `npx @larksuite/cli docs +media-insert --doc ${docId} --file "${ss.path}" --caption "${ss.name}原型"${asFlag}`;
    const result = runCmd(cmd, path.dirname(ss.path));

    if (result.ok) {
      console.log(`[uploader] Uploaded: ${ss.name}`);
      results.push({ name: ss.name, file: ss.file, status: 'ok' });
    } else {
      console.error(`[uploader] Failed: ${ss.name} - ${result.error.substring(0, 200)}`);
      results.push({ name: ss.name, file: ss.file, status: 'failed', error: result.error.substring(0, 500) });
    }

    await sleep(2000);
  }

  return results;
}

async function uploadSRSToFeishu(srsPath, options = {}) {
  const cwd = options.cwd || process.cwd();
  const asBot = options.asBot !== false;
  const asFlag = asBot ? ' --as bot' : '';
  const title = options.title || '需求规格说明书';

  if (options.docId) {
    const cmd = `npx @larksuite/cli docs +update --doc ${options.docId} --mode append --markdown "@${srsPath}"${asFlag}`;
    console.log(`[uploader] Appending SRS to existing doc: ${options.docId}`);

    const result = runCmd(cmd, cwd);
    if (result.ok) {
      console.log(`[uploader] SRS appended successfully`);
      return { ok: true, docId: options.docId };
    } else {
      console.error(`[uploader] Failed to append SRS: ${result.error.substring(0, 500)}`);
      return { ok: false, error: result.error };
    }
  } else {
    const cmd = `npx @larksuite/cli docs +create --markdown "@${srsPath}" --title "${title}"${asFlag}`;
    console.log(`[uploader] Creating new SRS document`);

    const result = runCmd(cmd, cwd);
    if (result.ok) {
      try {
        const parsed = JSON.parse(result.data);
        const newDocId = parsed.data?.doc_id || parsed.doc_id || '';
        console.log(`[uploader] SRS document created: ${newDocId}`);
        return { ok: true, docId: newDocId };
      } catch (e) {
        console.log(`[uploader] SRS document created (could not parse doc_id)`);
        return { ok: true, docId: '' };
      }
    } else {
      console.error(`[uploader] Failed to create SRS: ${result.error.substring(0, 500)}`);
      return { ok: false, error: result.error };
    }
  }
}

async function uploadPrototypeToFeishu(prototypeDir, options = {}) {
  const cwd = options.cwd || process.cwd();
  const asBot = options.asBot !== false;
  const asFlag = asBot ? ' --as bot' : '';
  const title = options.title || '交互原型';

  const files = fs.readdirSync(prototypeDir).filter((f) => f.endsWith('.html'));
  const results = [];

  for (const file of files) {
    const filePath = path.join(prototypeDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    const cmd = `npx @larksuite/cli docs +create --markdown "@${filePath}" --title "${title} - ${path.basename(file, '.html')}"${asFlag}`;
    console.log(`[uploader] Uploading prototype: ${file}`);

    const result = runCmd(cmd, cwd);
    if (result.ok) {
      console.log(`[uploader] Prototype uploaded: ${file}`);
      results.push({ file, status: 'ok' });
    } else {
      console.error(`[uploader] Failed to upload prototype: ${file}`);
      results.push({ file, status: 'failed', error: result.error.substring(0, 500) });
    }

    await sleep(2000);
  }

  return results;
}

module.exports = {
  uploadScreenshots,
  uploadSRSToFeishu,
  uploadPrototypeToFeishu,
};
