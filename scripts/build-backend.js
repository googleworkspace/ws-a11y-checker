/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Bundles backend TypeScript files into a single standalone dist/Code.js file compatible with Google Apps Script V8 runtime.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Clean up old unbundled subdirectories in dist/ if they exist
['checks', 'models', 'utils'].forEach((sub) => {
  const subDir = path.join(distDir, sub);
  if (fs.existsSync(subDir)) {
    fs.rmSync(subDir, { recursive: true, force: true });
  }
});

console.log('Bundling backend code with esbuild...');

// Run esbuild to bundle into an IIFE with global variable _app
const esbuildCmd = `npx esbuild backend/src/Code.ts --bundle --outfile=dist/Code.js --platform=neutral --target=es2020 --format=iife --global-name=_app`;
execSync(esbuildCmd, { cwd: rootDir, stdio: 'inherit' });

// Append explicit top-level function declarations so Google Apps Script engine discovers triggers and RPC handlers
const forwardingCode = `
// Explicit global forwarding declarations for Google Apps Script execution engine
function onOpen(e) { return _app.onOpen(e); }
function showSidebar() { return _app.showSidebar(); }
function populateTestCases(id) { return _app.populateTestCases(id); }
function rpcGetHostType() { return _app.rpcGetHostType(); }
function rpcRunChecks() { return _app.rpcRunChecks(); }
function rpcSelectElement(id) { return _app.rpcSelectElement(id); }
function rpcApplyFix(id, type, val) { return _app.rpcApplyFix(id, type, val); }
function rpcGetSlideElements(id) { return _app.rpcGetSlideElements(id); }
function rpcApplyReadingOrder(id, ids) { return _app.rpcApplyReadingOrder(id, ids); }
function rpcGetSettings() { return _app.rpcGetSettings(); }
function rpcSaveSettings(s) { return _app.rpcSaveSettings(s); }
`;

const codePath = path.join(distDir, 'Code.js');
let codeContent = fs.readFileSync(codePath, 'utf8');
codeContent += forwardingCode;
fs.writeFileSync(codePath, codeContent, 'utf8');

console.log('Successfully bundled standalone dist/Code.js');
