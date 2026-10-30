import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, symlink, rm, realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readCertificateFile, readLocalDeployment, createEvidenceDirectory} from '../scripts/local-files.mjs';
import {uploadCertificate} from '../scripts/ipfs-upload.mjs';

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'medtrace-path-'));
  try { await run(root); } finally { await rm(root, {recursive: true, force: true}); }
}

test('certificate reads preserve exact bytes in an explicitly approved directory', () => fixture(async root => {
  const file = join(root, 'certificate.json');
  const bytes = Buffer.from('{"synthetic":true}\n');
  await writeFile(file, bytes);
  assert.deepEqual((await readCertificateFile(file, {allowedRoots: [root]})).bytes, bytes);
}));

test('certificate uploads reject an out-of-root file before contacting Kubo', () => fixture(async root => {
  const approved = join(root, 'approved'); await mkdir(approved);
  const file = join(root, 'private.json'); await writeFile(file, '{"doNotUpload":true}');
  let contacted = false;
  await assert.rejects(uploadCertificate(file, {allowedRoots: [approved], fetchImpl: async () => { contacted = true; }}), /approved directory/);
  assert.equal(contacted, false);
}));

test('certificate paths reject traversal, symlink escapes and control characters', () => fixture(async root => {
  const approved = join(root, 'approved'); await mkdir(approved);
  const outside = join(root, 'outside.json'); await writeFile(outside, '{}');
  await symlink(outside, join(approved, 'link.json'));
  await assert.rejects(readCertificateFile(join(approved, 'link.json'), {allowedRoots: [approved]}), /approved directory/);
  await assert.rejects(readCertificateFile(`${approved}/../outside.json`, {allowedRoots: [approved]}), /traversal/);
  await assert.rejects(readCertificateFile('certificate.json\nforged log', {allowedRoots: [approved]}), /control characters/);
}));

test('certificate paths reject private environment files and empty inputs', () => fixture(async root => {
  const file = join(root, '.env'); await writeFile(file, 'PRIVATE_DATA=example');
  await assert.rejects(readCertificateFile(file, {allowedRoots: [root]}), /extension/);
  const empty = join(root, 'empty.json'); await writeFile(empty, '');
  await assert.rejects(readCertificateFile(empty, {allowedRoots: [root]}), /empty/);
}));

test('local acceptance accepts only a public/deployment.json manifest in approved project/temp roots', () => fixture(async root => {
  const publicDir = join(root, 'public'); await mkdir(publicDir);
  const manifest = {chainId: 31337, address: 'synthetic'};
  await writeFile(join(publicDir, 'deployment.json'), JSON.stringify(manifest));
  assert.deepEqual(await readLocalDeployment(join(publicDir, 'deployment.json')), manifest);
  await writeFile(join(publicDir, 'private.json'), '{}');
  await assert.rejects(readLocalDeployment(join(publicDir, 'private.json')), /name or extension/);
  await writeFile(join(root, 'deployment.json'), '{}');
  await assert.rejects(readLocalDeployment(join(root, 'deployment.json')), /public\/deployment/);
}));

test('evidence output rejects symlink escapes before creating directories outside its root', () => fixture(async root => {
  const approved = join(root, 'evidence'); await mkdir(approved);
  const outside = join(root, 'outside'); await mkdir(outside);
  await symlink(outside, join(approved, 'escape'));
  await assert.rejects(createEvidenceDirectory(join(approved, 'escape', 'new'), approved), /symlink escapes/);
  assert.equal(await createEvidenceDirectory(join(approved, 'proof'), approved), await realpath(join(approved, 'proof')));
}));
