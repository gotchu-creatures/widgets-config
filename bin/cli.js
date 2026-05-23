#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GOTCHU_URL = process.env.GOTCHU_URL;

if (!GOTCHU_URL) {
  throw new Error(`Env variable "GOTCHU_URL" is not defined.`);
}

// ─── Paths ────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Template engine ──────────────────────────────────────────────────────────

async function copyTemplate(src, dest, vars = {}) {
  await assertExists(src, `Template source not found: ${src}`);
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  await Promise.all(
    entries.map((entry) => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      return entry.isDirectory()
        ? copyTemplate(srcPath, destPath, vars)
        : copyFile(srcPath, destPath, vars);
    })
  );
}

async function copyFile(src, dest, vars) {
  if (isBinary(src)) {
    await fs.copyFile(src, dest);
    return;
  }

  const content = await fs.readFile(src, "utf8");
  const rendered = interpolate(content, vars);
  await fs.writeFile(dest, rendered, "utf8");
}

function interpolate(content, vars) {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    content
  );
}

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
  ".woff", ".woff2", ".ttf", ".eot",
  ".ico", ".pdf", ".zip",
]);

function isBinary(filePath) {
  return BINARY_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

// ─── Engine setup ─────────────────────────────────────────────────────────────

const ENGINES = {
  wigify: {
    label: "Wigify",
    widgets: ["gotchu"],
    templatesDir: path.resolve(__dirname, "../.config/wigify/widgets"),
    targetDir: (root) => path.join(root, ".config/wigify/widgets"),
  },
};

async function setupEngine(engine) {
  const config = ENGINES[engine];
  if (!config) {
    const supported = Object.keys(ENGINES).join(", ");
    throw new Error(`Unsupported engine: "${engine}". Supported: ${supported}`);
  }

  const root = process.cwd();
  await Promise.all(
    config.widgets.map((widget) => {
      const src = path.join(config.templatesDir, widget);
      const dest = path.join(config.targetDir(root), widget);
      return copyTemplate(src, dest, { GOTCHU_URL, });
    })
  );

  console.log(`✅ Widgets installed for ${config.label}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertExists(filePath, message) {
  await fs.access(filePath).catch(() => {
    throw new Error(message);
  });
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const engine = process.argv[2];

if (!engine) {
  console.error("Usage: setup-widget <engine>");
  console.error(`Available engines: ${Object.keys(ENGINES).join(", ")}`);
  process.exit(1);
}

setupEngine(engine).catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});