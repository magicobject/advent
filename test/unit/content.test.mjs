// A smoke test that scripts/build.mjs runs clean against the real content/ and produces every expected file,
// plus a basic check of public/404.html and wrangler.toml's not_found_handling.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

describe('the real content/ folder', () => {
  test('the build runs clean and produces every expected file', () => {
    execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: ROOT, stdio: 'pipe' });
    for (const file of ['index.html', 'config.json', 'scene.svg', 'day-01.json', 'day-25.json', 'day-26.json']) {
      assert.ok(existsSync(join(ROOT, 'public', file)), file);
    }
    const config = JSON.parse(readFileSync(join(ROOT, 'public', 'config.json'), 'utf8'));
    assert.equal(typeof config.siteName, 'string');
    assert.equal(typeof config.timeZone, 'string');
    assert.equal(config.dayCount, 25);
  });

  test('every shared asset the pages reference is written', () => {
    for (const file of ['assets/advent.js', 'assets/advent.css', 'embed/teaser.js', 'embed/teaser.css']) {
      assert.ok(existsSync(join(ROOT, 'public', file)), file);
    }
  });

  test('public/404.html exists (wrangler.toml\'s not_found_handling = "404-page" needs it, or unknown URLs get an empty 404)', () => {
    assert.ok(existsSync(join(ROOT, 'public', '404.html')));
    const wrangler = readFileSync(join(ROOT, 'wrangler.toml'), 'utf8');
    assert.match(wrangler, /not_found_handling\s*=\s*"404-page"/);
  });

  test('_headers has only one wildcard per rule (Cloudflare refuses more)', () => {
    const text = readFileSync(join(ROOT, 'public', '_headers'), 'utf8');
    for (const line of text.split('\n')) {
      if (line.startsWith('/')) assert.ok((line.match(/\*/g) ?? []).length <= 1, line);
    }
  });

  test('the generated calendar page carries no built-in church name by default', () => {
    const html = readFileSync(join(ROOT, 'public', 'index.html'), 'utf8');
    assert.match(html, /<title>Advent calendar<\/title>/);
    assert.match(html, /data-site-name=""/);
  });
});
