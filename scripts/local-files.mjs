// CLI input is a filename, not permission to read arbitrary local files.
import {readFile, realpath, stat, mkdir} from 'node:fs/promises';
import {basename, dirname, extname, isAbsolute, relative, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

export const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
export const CERTIFICATE_ROOTS = ['public/certificates', 'evidence/ipfs'].map(path => resolve(PROJECT_ROOT, path));
const certificateExtensions = new Set(['.pdf', '.json', '.txt', '.csv', '.png', '.jpg', '.jpeg', '.bin']);

function inside(root, path) {
  const remainder = relative(root, path);
  return remainder !== '' && remainder !== '..' && !remainder.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(remainder);
}

export async function approvedFilePath(input, {roots, extensions, name} = {}) {
  if (typeof input !== 'string' || !input || /[\x00-\x1f\x7f]/.test(input)) {
    throw new Error('File path must be nonempty and contain no control characters.');
  }
  if (input.split(/[\\/]/).includes('..')) {
    throw new Error('Parent-directory traversal is not allowed.');
  }
  const path = await realpath(resolve(input));
  const approved = await Promise.all(roots.map(root => realpath(root).catch(() => null)));
  if (!approved.some(root => root && inside(root, path))) {
    throw new Error('File must remain inside an approved directory, including after resolving symlinks.');
  }
  if ((name && basename(path) !== name) || (extensions && !extensions.has(extname(path).toLowerCase()))) {
    throw new Error('File name or extension is not allowed for this operation.');
  }
  if (!(await stat(path)).isFile()) throw new Error('Expected a regular file.');
  return path;
}

export async function readCertificateFile(input, {allowedRoots = CERTIFICATE_ROOTS} = {}) {
  const path = await approvedFilePath(input, {roots: allowedRoots, extensions: certificateExtensions});
  if ((await stat(path)).size > 8 * 1024 * 1024) throw new Error('Classroom file size limit is 8 MiB');
  const bytes = await readFile(path);
  if (!bytes.length) throw new Error('Certificate file must not be empty.');
  if (bytes.length > 8 * 1024 * 1024) throw new Error('Classroom file size limit is 8 MiB');
  return {path, bytes};
}

export async function readLocalDeployment(input) {
  const path = await approvedFilePath(input, {
    roots: [PROJECT_ROOT, dirname(PROJECT_ROOT), tmpdir()],
    extensions: new Set(['.json']),
    name: 'deployment.json',
  });
  if (basename(dirname(path)) !== 'public') throw new Error('Expected a fresh project public/deployment.json.');
  if ((await stat(path)).size > 1024 * 1024) throw new Error('Deployment manifest is too large.');
  return JSON.parse(await readFile(path, 'utf8'));
}

async function existingAncestor(path) {
  try { return await realpath(path); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const parent = dirname(path);
    if (parent === path) throw error;
    return existingAncestor(parent);
  }
}

export async function createEvidenceDirectory(input, root = resolve(PROJECT_ROOT, 'evidence')) {
  if (typeof input !== 'string' || !input || /[\x00-\x1f\x7f]/.test(input) || input.split(/[\\/]/).includes('..')) {
    throw new Error('Evidence directory must contain no control characters or parent traversal.');
  }
  const approved = await realpath(root);
  const path = resolve(input);
  if (!inside(resolve(root), path)) throw new Error('Evidence directory must be a subdirectory of the project evidence directory.');
  const ancestor = await existingAncestor(path);
  if (ancestor !== approved && !inside(approved, ancestor)) throw new Error('Evidence directory symlink escapes the approved directory.');
  await mkdir(path, {recursive: true});
  const actual = await realpath(path);
  if (!inside(approved, actual)) throw new Error('Evidence directory escapes the approved directory.');
  return actual;
}
