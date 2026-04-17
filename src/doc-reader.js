const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCmd(cmd, cwd) {
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
      timeout: 120000,
      cwd: cwd || process.cwd(),
    });
    return { ok: true, data: result };
  } catch (e) {
    return { ok: false, error: (e.stdout || '') + (e.stderr || '') };
  }
}

function extractTokenFromUrl(url) {
  if (!url) return null;

  const patterns = [
    /\/docx\/([A-Za-z0-9]+)/,
    /\/doc\/([A-Za-z0-9]+)/,
    /\/wiki\/([A-Za-z0-9]+)/,
    /\/sheets\/([A-Za-z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return { token: match[1], type: pattern.source.match(/docx|doc|wiki|sheets/)?.[0] || 'unknown' };
  }

  if (/^[A-Za-z0-9]+$/.test(url)) {
    return { token: url, type: 'unknown' };
  }

  return null;
}

async function resolveWikiToken(wikiToken, cwd) {
  const cmd = `npx @larksuite/cli wiki spaces get_node --params '{"token":"${wikiToken}"}' --as bot`;
  const result = runCmd(cmd, cwd);

  if (!result.ok) {
    throw new Error(`Failed to resolve wiki token: ${result.error.substring(0, 500)}`);
  }

  try {
    const parsed = JSON.parse(result.data);
    const node = parsed.data?.node || parsed.node;
    if (node) {
      return {
        objType: node.obj_type,
        objToken: node.obj_token,
        title: node.title,
      };
    }
  } catch (e) {
    throw new Error(`Failed to parse wiki node response: ${e.message}`);
  }

  throw new Error('Could not extract node info from wiki response');
}

async function fetchDocument(docUrlOrToken, options = {}) {
  const cwd = options.cwd || process.cwd();
  const asBot = options.asBot !== false;

  const tokenInfo = extractTokenFromUrl(docUrlOrToken);
  if (!tokenInfo) {
    throw new Error(`Invalid document URL or token: ${docUrlOrToken}`);
  }

  let docToken = tokenInfo.token;

  if (tokenInfo.type === 'wiki') {
    console.log(`[doc-reader] Resolving wiki token: ${docToken}`);
    const resolved = await resolveWikiToken(docToken, cwd);
    console.log(`[doc-reader] Wiki resolved: type=${resolved.objType}, token=${resolved.objToken}`);
    docToken = resolved.objToken;
  }

  const asFlag = asBot ? ' --as bot' : '';
  const cmd = `npx @larksuite/cli docs +fetch --doc ${docToken}${asFlag}`;
  console.log(`[doc-reader] Fetching document: ${docToken}`);

  const result = runCmd(cmd, cwd);
  if (!result.ok) {
    throw new Error(`Failed to fetch document: ${result.error.substring(0, 500)}`);
  }

  try {
    const parsed = JSON.parse(result.data);
    const markdown = parsed.data?.markdown || parsed.markdown || '';
    const title = parsed.data?.title || parsed.title || '';

    return {
      title,
      markdown,
      docToken,
      raw: parsed,
    };
  } catch (e) {
    throw new Error(`Failed to parse document response: ${e.message}`);
  }
}

function parseRequirementStructure(markdown) {
  const lines = markdown.split('\n');
  const structure = {
    projectName: '',
    overview: '',
    modules: [],
    nonFunctionalReqs: [],
    userRoles: [],
    assumptions: [],
  };

  let currentModule = null;
  let currentFeature = null;
  let currentSection = '';
  let buffer = [];

  function flushBuffer() {
    if (buffer.length === 0) return;
    const text = buffer.join('\n').trim();
    if (!text) return;

    if (currentFeature) {
      currentFeature.description += (currentFeature.description ? '\n' : '') + text;
    } else if (currentModule) {
      currentModule.description += (currentModule.description ? '\n' : '') + text;
    }
    buffer = [];
  }

  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)/);
    const h2Match = line.match(/^##\s+(.+)/);
    const h3Match = line.match(/^###\s+(.+)/);
    const listItemMatch = line.match(/^[-*]\s+(.+)/);

    if (h1Match) {
      flushBuffer();
      if (!structure.projectName) {
        structure.projectName = h1Match[1].trim();
      }
      currentSection = 'overview';
      continue;
    }

    if (h2Match) {
      flushBuffer();
      const title = h2Match[1].trim();

      if (/非功能|性能|安全|可用性|兼容/.test(title)) {
        currentSection = 'nonFunctional';
        currentModule = null;
        currentFeature = null;
      } else if (/用户|角色|权限/.test(title)) {
        currentSection = 'userRoles';
        currentModule = null;
        currentFeature = null;
      } else if (/概述|背景|目的|范围|引言/.test(title)) {
        currentSection = 'overview';
        currentModule = null;
        currentFeature = null;
      } else if (/假设|依赖|约束/.test(title)) {
        currentSection = 'assumptions';
        currentModule = null;
        currentFeature = null;
      } else {
        currentSection = 'module';
        currentModule = {
          name: title,
          description: '',
          features: [],
          type: detectModuleType(title),
        };
        structure.modules.push(currentModule);
        currentFeature = null;
      }
      continue;
    }

    if (h3Match) {
      flushBuffer();
      const title = h3Match[1].trim();

      if (currentModule) {
        currentFeature = {
          name: title,
          description: '',
          interactions: [],
          fields: [],
        };
        currentModule.features.push(currentFeature);
      }
      continue;
    }

    if (listItemMatch) {
      const item = listItemMatch[1].trim();
      if (currentSection === 'nonFunctional') {
        structure.nonFunctionalReqs.push(item);
      } else if (currentSection === 'userRoles') {
        structure.userRoles.push(item);
      } else if (currentSection === 'assumptions') {
        structure.assumptions.push(item);
      } else if (currentFeature) {
        currentFeature.interactions.push(item);
      }
      continue;
    }

    buffer.push(line);
  }

  flushBuffer();

  return structure;
}

function detectModuleType(moduleName) {
  if (/管理|后台|admin|dashboard|运营/.test(moduleName)) {
    return 'admin';
  }
  if (/小程序|移动|h5|mobile|app|微信/.test(moduleName)) {
    return 'mobile';
  }
  if (/接口|api|服务|server|后端/.test(moduleName)) {
    return 'api';
  }
  return 'general';
}

module.exports = {
  fetchDocument,
  parseRequirementStructure,
  extractTokenFromUrl,
  resolveWikiToken,
};
