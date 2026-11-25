import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const LOGO_PATH = path.join(ROOT, "public", "images", "kiro_maal_logo_dark.png");
const ANDROID_RES = path.join(ROOT, "android", "app", "src", "main", "res");
const NAVY_BG = { r: 11, g: 23, b: 40, alpha: 1 }; // #0B1728

const MIPMAP_SIZES = [
  { folder: "mipmap-mdpi", size: 48, fgSize: 108 },
  { folder: "mipmap-hdpi", size: 72, fgSize: 162 },
  { folder: "mipmap-xhdpi", size: 96, fgSize: 216 },
  { folder: "mipmap-xxhdpi", size: 144, fgSize: 324 },
  { folder: "mipmap-xxxhdpi", size: 192, fgSize: 432 },
];

const SPLASH_SIZES = [
  { folder: "drawable", width: 1080, height: 1920 },
  { folder: "drawable-port-mdpi", width: 320, height: 480 },
  { folder: "drawable-port-hdpi", width: 480, height: 800 },
  { folder: "drawable-port-xhdpi", width: 720, height: 1280 },
  { folder: "drawable-port-xxhdpi", width: 960, height: 1600 },
  { folder: "drawable-port-xxxhdpi", width: 1280, height: 1920 },
  { folder: "drawable-land-mdpi", width: 480, height: 320 },
  { folder: "drawable-land-hdpi", width: 800, height: 480 },
  { folder: "drawable-land-xhdpi", width: 1280, height: 720 },
  { folder: "drawable-land-xxhdpi", width: 1600, height: 960 },
  { folder: "drawable-land-xxxhdpi", width: 1920, height: 1280 },
];

async function buildIcon(size, paddingRatio = 0.16) {
  const inner = Math.max(16, Math.round(size * (1 - paddingRatio * 2)));
  const resizedLogo = await sharp(LOGO_PATH)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: NAVY_BG },
  })
    .composite([{ input: resizedLogo, gravity: "center" }])
    .png()
    .toBuffer();
}

async function buildRoundIcon(size) {
  const square = await buildIcon(size, 0.18);
  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );
  return sharp(square)
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function buildSplash(width, height) {
  const logoWidth = Math.round(Math.min(width, height) * 0.56);
  const resizedLogo = await sharp(LOGO_PATH)
    .resize(logoWidth, logoWidth, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: { width, height, channels: 4, background: NAVY_BG },
  })
    .composite([{ input: resizedLogo, gravity: "center" }])
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(LOGO_PATH)) {
    throw new Error(`Brand logo not found at ${LOGO_PATH}`);
  }
  if (!fs.existsSync(ANDROID_RES)) {
    throw new Error(`Android res folder not found at ${ANDROID_RES}. Run "npx cap add android" first.`);
  }

  // 1. Generate mipmap icons
  for (const { folder, size, fgSize } of MIPMAP_SIZES) {
    const dir = path.join(ANDROID_RES, folder);
    fs.mkdirSync(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, "ic_launcher.png"), await buildIcon(size, 0.14));
    await fs.promises.writeFile(path.join(dir, "ic_launcher_round.png"), await buildRoundIcon(size));
    await fs.promises.writeFile(
      path.join(dir, "ic_launcher_foreground.png"),
      await buildIcon(fgSize, 0.24)
    );
  }

  // 2. Ensure adaptive icon background color is Deep Navy #0B1728
  const valuesDir = path.join(ANDROID_RES, "values");
  fs.mkdirSync(valuesDir, { recursive: true });
  fs.writeFileSync(
    path.join(valuesDir, "ic_launcher_background.xml"),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0B1728</color>\n</resources>\n`
  );

  // 3. Generate Play Store 512x512 icon
  const playStoreIcon = await buildIcon(512, 0.12);
  await fs.promises.writeFile(path.join(ROOT, "android", "playstore-icon-512.png"), playStoreIcon);

  // 4. Generate Splash Screens
  for (const { folder, width, height } of SPLASH_SIZES) {
    const dir = path.join(ANDROID_RES, folder);
    fs.mkdirSync(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, "splash.png"), await buildSplash(width, height));
  }

  console.log("Generated all Kiro-Maal Android launcher icons, adaptive foregrounds, Play Store 512px icon, and splash screens.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

