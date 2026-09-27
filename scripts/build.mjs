import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { weddingConfig } from '../src/wedding-config.js';

const destination = new URL('../dist/', import.meta.url);
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(new URL('../src/', import.meta.url), new URL('./src/', destination), { recursive: true });
await cp(new URL('../assets/', import.meta.url), new URL('./assets/', destination), { recursive: true });
await cp(new URL('../new_assets/', import.meta.url), new URL('./new_assets/', destination), { recursive: true });

const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const siteUrl = weddingConfig.siteUrl.endsWith('/') ? weddingConfig.siteUrl : `${weddingConfig.siteUrl}/`;
const replacements = {
  '%PAGE_TITLE%': weddingConfig.copy.pageTitle,
  '%PAGE_DESCRIPTION%': weddingConfig.copy.pageDescription,
  '%SITE_URL%': siteUrl,
  '%SOCIAL_IMAGE_URL%': new URL(weddingConfig.socialPreviewPath, siteUrl).href,
  '%COVER_POSTER_URL%': weddingConfig.coverPosterPath,
  '%ENTRANCE_VIDEO_URL%': weddingConfig.entranceVideoPath,
};
let html = await readFile(new URL('../index.template.html', import.meta.url), 'utf8');
for (const [token, value] of Object.entries(replacements)) html = html.replaceAll(token, escapeHtml(value));
await writeFile(join(fileURLToPath(destination), 'index.html'), html);
await writeFile(new URL('../index.html', import.meta.url), html);
