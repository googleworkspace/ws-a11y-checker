/**
 * Post-build bundler script that merges Angular dist output (HTML, CSS, JS) into a single sidebar.html inside dist/
 * compatible with Google Apps Script HtmlService, and copies appsscript.json manifest into dist/.
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(__dirname, '../dist');
const browserDir = path.join(__dirname, '../ui/dist/ui/browser');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 1. Copy appsscript.json manifest into dist/
const manifestPath = path.join(rootDir, 'appsscript.json');
if (fs.existsSync(manifestPath)) {
  fs.copyFileSync(manifestPath, path.join(distDir, 'appsscript.json'));
  console.log('Copied appsscript.json to dist/');
}

// 2. Bundle Angular output into sidebar.html
let htmlContent = '<!DOCTYPE html><html><head><title>Accessibility Checker</title><style>body { font-family: Roboto, Arial, sans-serif; padding: 12px; }</style></head><body><h2>Accessibility Checker</h2><p>Loading UI...</p></body></html>';

const indexHtmlPath = path.join(browserDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

  // Inline CSS files (<link rel="stylesheet" href="...">)
  htmlContent = htmlContent.replace(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/gi, (match, href) => {
    const cssPath = path.join(browserDir, href);
    if (fs.existsSync(cssPath)) {
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      return `<style>\n${cssContent}\n</style>`;
    }
    return match;
  });

  // Inline JS files (<script src="..." ...></script>)
  htmlContent = htmlContent.replace(/<script[^>]+src="([^"]+)"[^>]*><\/script>/gi, (match, src) => {
    const jsPath = path.join(browserDir, src);
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      return `<script>\n${jsContent}\n</script>`;
    }
    return match;
  });
}

fs.writeFileSync(path.join(distDir, 'sidebar.html'), htmlContent, 'utf8');
const stats = fs.statSync(path.join(distDir, 'sidebar.html'));
console.log(`Successfully bundled sidebar.html (${(stats.size / 1024).toFixed(2)} KB) to dist/`);
