import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { apply, inject } from '../lib/index.js';

test('public client module exposes the real 16 palettes and 8 vector moods without a host', async () => {
  let entry;
  vm.runInNewContext(await readFile(new URL('../lib/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load: spec => { entry = spec; } } },
  });
  const api = entry.factory(name => {
    if (name === 'react/jsx-runtime') return {};
    if (name === 'react') return {};
    if (name === '@deepseek-ai/dsh-client-runtime/client') return { defineStore: x => x };
    throw Error(`Unexpected module: ${name}`);
  });
  assert.equal(api.SKINS.length, 16);
  assert.equal(api.SKINS.filter(skin => skin.id.startsWith('skin-whale')).length, 9);
  assert.equal(api.NAILONG_PACK.length, 8);
  for (const mood of api.NAILONG_PACK) assert.match(api.dragonSvg(mood), /^<svg/);
});

test('optional-art routes return a defined missing-asset result and reject writes; disposal unregisters routes', async () => {
  const routes = [];
  let cleanup, disposed = 0;
  assert.deepEqual(inject, ['webServer']);
  apply({
    webServer: { register: route => { routes.push(route); return () => disposed++; } },
    effect: factory => { cleanup = factory(); },
  });
  assert.equal(routes.length, 9);
  for (const method of ['GET', 'HEAD', 'POST']) {
    const headers = {};
    let ended = false, payload;
    const response = { setHeader: (k, v) => { headers[k] = v; }, end: v => { ended = true; payload = v; } };
    await routes[0].handler({ method }, response);
    assert.equal(response.statusCode, method === 'POST' ? 405 : 404);
    assert.ok(ended);
    assert.equal(payload, undefined);
    if (method === 'POST') assert.equal(headers.Allow, 'GET, HEAD');
  }
  cleanup();
  assert.equal(disposed, 9);
});
