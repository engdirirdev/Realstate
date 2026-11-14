/**
 * Pre-flight preparation script for `npm run dev` on Windows.
 *
 * 1. Removes stale `.next/trace` files that cause `EPERM: operation not permitted` on Windows.
 * 2. Detects if `.next` contains a production build (`BUILD_ID` / `prerender-manifest.json`)
 *    from a prior `npm run build` and cleans it so `next dev --turbopack` never crashes
 *    with corrupted manifest or chunk errors, while preserving `.next` across normal dev restarts.
 */
const fs = require("fs");
const path = require("path");

const nextDir = path.join(__dirname, "..", ".next");
const traceFile = path.join(nextDir, "trace");
const buildIdFile = path.join(nextDir, "BUILD_ID");
const prerenderManifest = path.join(nextDir, "prerender-manifest.json");

function safeRemove(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  } catch (err) {
    // Ignore if locked by an active process
  }
}

if (fs.existsSync(nextDir)) {
  // Always clear stale trace file to prevent EPERM on Windows
  safeRemove(traceFile);

  // If .next holds production build artifacts, clean it so dev mode starts fresh without manifest conflicts
  if (fs.existsSync(buildIdFile) || fs.existsSync(prerenderManifest)) {
    console.log("[prepare-dev] Detected production build artifacts in .next — cleaning for fast dev startup...");
    safeRemove(nextDir);
  }
}

