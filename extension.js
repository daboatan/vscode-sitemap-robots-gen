const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function extractCanonicalUrl(html) {
  const canonicalRegex = /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i;
  const match = html.match(canonicalRegex);
  return match ? match[1].trim() : null;
}

function normalizeCanonicalUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (!url.pathname.endsWith('/')) {
    url.pathname += '/';
  }
  return url;
}

function buildRobotsTxt(sitemapUrl) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
}

function buildSitemapXml(pageUrl, lastmodIso) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset\n      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n      xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n\n<url>\n  <loc>${escapeXml(pageUrl)}</loc>\n  <lastmod>${lastmodIso}</lastmod>\n</url>\n\n</urlset>\n`;
}

function getTargetFileUri(uriArg) {
  if (uriArg && uriArg.fsPath) {
    return uriArg;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return null;
  }

  return editor.document.uri;
}

async function generateSeoFiles(uriArg) {
  const targetUri = getTargetFileUri(uriArg);

  if (!targetUri) {
    vscode.window.showErrorMessage('No active HTML file found. Open an HTML file first.');
    return;
  }

  const filePath = targetUri.fsPath;
  const ext = path.extname(filePath).toLowerCase();

  if (!['.html', '.htm'].includes(ext)) {
    vscode.window.showErrorMessage('This command only works for .html or .htm files.');
    return;
  }

  let document = vscode.workspace.textDocuments.find((doc) => doc.uri.fsPath === filePath);

  if (!document) {
    try {
      document = await vscode.workspace.openTextDocument(targetUri);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open HTML file: ${error.message}`);
      return;
    }
  }

  if (document.isUntitled) {
    vscode.window.showErrorMessage('Save the HTML file first before generating SEO files.');
    return;
  }

  const html = document.getText();
  const canonicalRaw = extractCanonicalUrl(html);

  if (!canonicalRaw) {
    vscode.window.showErrorMessage('Canonical URL not found. Add <link rel="canonical" href="..."> to the HTML file.');
    return;
  }

  let canonicalUrl;
  try {
    canonicalUrl = normalizeCanonicalUrl(canonicalRaw);
  } catch (error) {
    vscode.window.showErrorMessage(`Invalid canonical URL: ${canonicalRaw}`);
    return;
  }

  const dir = path.dirname(filePath);
  const sitemapUrl = new URL('sitemap.xml', canonicalUrl.href).href;

  let stats;
  try {
    stats = fs.statSync(filePath);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to read file metadata: ${error.message}`);
    return;
  }

  const lastmodIso = new Date(stats.mtime).toISOString().replace('.000Z', '+00:00');
  const robotsContent = buildRobotsTxt(sitemapUrl);
  const sitemapContent = buildSitemapXml(canonicalUrl.href, lastmodIso);

  const robotsPath = path.join(dir, 'robots.txt');
  const sitemapPath = path.join(dir, 'sitemap.xml');

  try {
    fs.writeFileSync(robotsPath, robotsContent, 'utf8');
    fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to write SEO files: ${error.message}`);
    return;
  }

  vscode.window.showInformationMessage(
    `SEO files generated in ${dir}`,
    'Open robots.txt',
    'Open sitemap.xml'
  ).then(async (choice) => {
    if (choice === 'Open robots.txt') {
      const doc = await vscode.workspace.openTextDocument(robotsPath);
      await vscode.window.showTextDocument(doc, { preview: false });
    }
    if (choice === 'Open sitemap.xml') {
      const doc = await vscode.workspace.openTextDocument(sitemapPath);
      await vscode.window.showTextDocument(doc, { preview: false });
    }
  });
}

function activate(context) {
  const disposable = vscode.commands.registerCommand('seoFileGenerator.generateFiles', generateSeoFiles);
  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
