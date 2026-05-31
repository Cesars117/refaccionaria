import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ZipArchive } from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const srcStandalone = path.join(rootDir, '.next', 'standalone');
const srcStatic = path.join(rootDir, '.next', 'static');
const srcPublic = path.join(rootDir, 'public');
const srcPrisma = path.join(rootDir, 'node_modules', '.prisma', 'client');
const outputZip = path.join(rootDir, 'deploy.zip');
const tempDir = path.join(rootDir, 'HOSTINGER_READY');

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

function copyFolderRecursiveSync(sources, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  sources.forEach(src => {
    if (!fs.existsSync(src)) return;
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
      fs.readdirSync(src).forEach(child => {
        const curSrc = path.join(src, child);
        const curTarget = path.join(target, child);
        const curStats = fs.statSync(curSrc);
        if (curStats.isDirectory()) {
          copyFolderRecursiveSync([curSrc], curTarget);
        } else {
          fs.copyFileSync(curSrc, curTarget);
        }
      });
    } else {
      fs.copyFileSync(src, path.join(target, path.basename(src)));
    }
  });
}

async function prepare() {
  console.log("🧹 Cleaning temp folder...");
  deleteFolderRecursive(tempDir);
  fs.mkdirSync(tempDir, { recursive: true });

  // 1. Copy standalone contents
  console.log("📦 Copying standalone...");
  if (fs.existsSync(srcStandalone)) {
    copyFolderRecursiveSync([srcStandalone], tempDir);
  } else {
    console.error("❌ Standalone build not found. Please run 'npm run build' first.");
    process.exit(1);
  }

  // 2. Copy static
  console.log("📦 Copying static assets...");
  const destStatic = path.join(tempDir, '.next', 'static');
  copyFolderRecursiveSync([srcStatic], destStatic);

  // 3. Copy public
  console.log("📦 Copying public folder...");
  const destPublic = path.join(tempDir, 'public');
  copyFolderRecursiveSync([srcPublic], destPublic);

  // 4. Copy Prisma client
  console.log("📦 Copying Prisma client...");
  const destPrisma = path.join(tempDir, '.prisma', 'client');
  copyFolderRecursiveSync([srcPrisma], destPrisma);

  // 5. Copy .env.production as .env
  const prodEnv = path.join(rootDir, '.env.production');
  const destEnv = path.join(tempDir, '.env');
  if (fs.existsSync(prodEnv)) {
    console.log("📦 Copying .env.production as .env...");
    fs.copyFileSync(prodEnv, destEnv);
  }

  // 6. Create ZIP
  console.log(`🤐 Creating ${outputZip} using archiver...`);
  if (fs.existsSync(outputZip)) {
    fs.unlinkSync(outputZip);
  }

  const output = fs.createWriteStream(outputZip);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  output.on('close', () => {
    const sizeMb = archive.pointer() / 1024 / 1024;
    console.log(`✅ [SUCCESS] deploy.zip created successfully! (${sizeMb.toFixed(1)} MB)`);
    // Clean up temp directory
    deleteFolderRecursive(tempDir);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);
  archive.directory(tempDir, false);
  await archive.finalize();
}

prepare().catch(console.error);
