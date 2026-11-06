/**
 * Postinstall patch for Next.js 15 dev overlay.
 * Suppresses third-party browser extension noise (such as Bitdefender's bis_skin_checked attribute injection)
 * from triggering the intrusive red React Dev Overlay modal during local development.
 */
const fs = require('fs');
const path = require('path');

function patchFile(filePath, search, replacement) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('bis_skin_checked')) {
    console.log('[patch-next-overlay] Already patched:', filePath);
    return;
  }
  if (content.includes(search)) {
    content = content.replace(search, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[patch-next-overlay] Successfully patched:', filePath);
  }
}

// 1. Patch intercept-console-error.js
const interceptPath = path.join(
  __dirname,
  '../node_modules/next/dist/client/components/globals/intercept-console-error.js'
);
patchFile(
  interceptPath,
  'if (!(0, _isnextroutererror.isNextRouterError)(maybeError)) {',
  `if (!(0, _isnextroutererror.isNextRouterError)(maybeError)) {
            const isExtensionNoise = args.some(function(arg) {
                var s = typeof arg === "string" ? arg : (arg && arg.message ? arg.message : "");
                return s.indexOf("bis_skin_checked") !== -1 || s.indexOf("bis_") !== -1;
            });
            if (isExtensionNoise) return;`
);

// 2. Patch use-error-handler.js
const handlerPath = path.join(
  __dirname,
  '../node_modules/next/dist/client/components/react-dev-overlay/internal/helpers/use-error-handler.js'
);
patchFile(
  handlerPath,
  'function handleClientError(originError, consoleErrorArgs, capturedFromConsole) {',
  `function handleClientError(originError, consoleErrorArgs, capturedFromConsole) {
    var allArgs = [originError].concat(consoleErrorArgs || []);
    if (allArgs.some(function(a) { var s = typeof a === "string" ? a : (a && a.message ? a.message : ""); return s.indexOf("bis_skin_checked") !== -1 || s.indexOf("bis_") !== -1; })) return;`
);

