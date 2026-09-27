import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

test('the direct-open preview contains its boot code and the supplied door video', async () => {
  const html = await readFile(new URL('../index.template.html', import.meta.url), 'utf8');
  assert.match(html, /<source src="new_assets\/entrance\.mp4" type="video\/mp4">/);
  assert.match(html, /<script>\s*[\s\S]*initExperience\(config, showToast\)/);
  assert.doesNotMatch(html, /<script type="module"/);
  assert.doesNotMatch(html, /%ENTRANCE_VIDEO_URL%/);
  assert.ok((await stat(new URL('../new_assets/entrance.mp4', import.meta.url))).size > 0);
});
