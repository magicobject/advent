// Unit tests for the tenant discovery/slug rules (src/core/schema.mjs's slugIsSafe) and for scripts/build.mjs
// running end to end against the real tenants/ folder.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RESERVED_SLUGS, slugIsSafe } from '../../src/core/schema.mjs';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

describe('slugIsSafe: a church folder name doubles as its page address', () => {
  test('accepts plain lower-case words joined by single hyphens', () => {
    for (const ok of ['kington', 'st-martin', 'the-dove', 'a1']) assert.equal(slugIsSafe(ok), true, ok);
  });

  test('rejects anything that is not a plain slug, and every reserved name', () => {
    for (const bad of ['Kington', 'st_martin', 'a b', '../x', '', 'a'.repeat(33), 'a--b', '-a', 'a-', 'con', 'lpt1']) {
      assert.equal(slugIsSafe(bad), false, bad);
    }
    for (const reserved of RESERVED_SLUGS) assert.equal(slugIsSafe(reserved), false, reserved);
  });
});

describe('the real tenants/ folder', () => {
  const slugs = readdirSync(join(ROOT, 'tenants'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name);

  test('every tenant folder name is a safe slug', () => {
    assert.ok(slugs.length > 0, 'expected at least one tenant');
    for (const slug of slugs) assert.equal(slugIsSafe(slug), true, slug);
  });

  test('the build runs clean and produces every expected file for every tenant', () => {
    execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: ROOT, stdio: 'pipe' });
    for (const slug of slugs) {
      const dir = join(ROOT, 'public', slug);
      for (const file of ['index.html', 'config.json', 'scene.svg', 'day-01.json', 'day-25.json']) {
        assert.ok(existsSync(join(dir, file)), `${slug}/${file}`);
      }
      const config = JSON.parse(readFileSync(join(dir, 'config.json'), 'utf8'));
      assert.equal(typeof config.siteName, 'string');
      assert.ok(config.siteName.length > 0);
    }
    for (const file of ['assets/advent.js', 'assets/advent.css', 'embed/teaser.js', 'embed/teaser.css', '_headers']) {
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
});
