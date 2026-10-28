const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
require('./core.js');
const H = globalThis.HashCheck;
const item = (overrides = {}) => ({status:'ready', algorithm:'SHA-256', hash:'abc', file:{name:'example.txt', size:3, type:'text/plain', lastModified:0}, ...overrides});
test('comparison requires completed results using the same algorithm', () => {
  assert.equal(H.compare(item(), null), null);
  assert.equal(H.compare(item(), item({status:'reading'})), null);
  assert.equal(H.compare(item(), item({algorithm:'SHA-512'})), null);
  assert.throws(() => H.report(item(), null));
});
test('compares size and content hash independently of name and timestamp', () => {
  assert.equal(H.compare(item(), item({file:{name:'renamed.txt', size:3, lastModified:10}})), true);
  assert.equal(H.compare(item(), item({hash:'def'})), false);
  assert.equal(H.compare(item(), item({file:{size:4}})), false);
});
test('reports preserve exact metadata and escape untrusted file names', () => {
  const a = item({file:{name:'<script>alert("x")</script>.txt', size:3, type:'<x>', lastModified:0}});
  const data = H.report(a, item(), new Date('2026-09-18T12:00:00Z'));
  assert.equal(data.matches, true);
  assert.equal(data.files[0].sizeBytes, 3);
  assert.match(H.asText(data), /2026-09-18T12:00:00.000Z/);
  assert.ok(!H.asHtml(data).includes('<script>'));
  assert.match(H.asHtml(data), /&lt;script&gt;/);
  assert.equal(H.report(item(), item({hash:'different'})).matches, false);
});
test('actual worker hashes empty, known and binary content for every algorithm', async () => {
  const source = readFileSync(__dirname + '/app.js', 'utf8').match(/const workerSource = `([\s\S]*?)`;/)[1];
  const {webcrypto, createHash} = require('node:crypto');
  for (const algorithm of H.algorithms) {
    for (const buffer of [Buffer.alloc(0), Buffer.from('abc'), Buffer.from([0,255,128,1,13,10])]) {
      const messages = [];
      const context = vm.createContext({crypto:webcrypto, Uint8Array, postMessage: data => messages.push(data)});
      vm.runInContext(source, context);
      await context.onmessage({data:{file:new Blob([buffer]), algorithm}});
      assert.equal(messages[0].stage, 'hashing');
      assert.equal(messages[1].hash, createHash(algorithm.replace('-', '').toLowerCase()).update(buffer).digest('hex'));
    }
  }
});
