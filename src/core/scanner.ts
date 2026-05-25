import fs from 'fs';
import path from 'path';

export interface FolderNode {
  name: string;
  path: string;
  files: string[];
  folders: FolderNode[];
}

export interface ProjectReport {
  root: string;
  truncated?: boolean;
  folderStructure: FolderNode;
  keyFiles: Record<string, unknown>;
  entryPoints: string[];
}

const DEFAULT_IGNORES = new Set(['node_modules', 'dist', 'build', '.git']);
const KEY_FILES = new Set(['package.json', 'tsconfig.json', 'README.md']);
const COMMON_ENTRY_FILES = ['index.js', 'index.ts', 'src/index.ts', 'src/main.ts', 'lib/index.js'];

function makeNode(absPath: string): FolderNode {
  return {
    name: path.basename(absPath),
    path: absPath,
    files: [],
    folders: [],
  };
}

export async function scanProject(rootPath: string, options?: { ignore?: string[]; maxEntries?: number }): Promise<ProjectReport> {
  const ignoreSet = new Set(DEFAULT_IGNORES);
  (options?.ignore || []).forEach(p => ignoreSet.add(p));
  const maxEntries = options?.maxEntries ?? 20000; // safety cap

  const rootNode = makeNode(rootPath);
  let entries = 0;
  let truncated = false;
  const keyFiles: Record<string, unknown> = {};

  const stack: FolderNode[] = [rootNode];

  while (stack.length) {
    const node = stack.pop()!;
    let dirents: fs.Dirent[];
    try {
      dirents = await fs.promises.readdir(node.path, { withFileTypes: true });
    } catch (err) {
      // permission denied or similar - skip
      continue;
    }

    for (const dirent of dirents) {
      if (entries >= maxEntries) {
        truncated = true;
        break;
      }

      const name = dirent.name;
      if (ignoreSet.has(name)) continue;

      const abs = path.join(node.path, name);

      if (dirent.isDirectory()) {
        const child = makeNode(abs);
        node.folders.push(child);
        stack.push(child);
      } else if (dirent.isFile()) {
        node.files.push(name);
        entries += 1;

        if (KEY_FILES.has(name) && keyFiles[name] === undefined) {
          try {
            const content = await fs.promises.readFile(abs, 'utf8');
            if (name.endsWith('.json')) {
              try {
                keyFiles[name] = JSON.parse(content);
              } catch {
                keyFiles[name] = content;
              }
            } else {
              keyFiles[name] = content;
            }
          } catch {
            // ignore read errors
          }
        }
      }
    }

    if (truncated) break;
  }

  // Determine entry points
  const entryPoints: string[] = [];

  // From package.json
  const pkg = keyFiles['package.json'] as any | undefined;
  if (pkg) {
    const candidates: string[] = [];
    if (typeof pkg.main === 'string') candidates.push(pkg.main);
    if (typeof pkg.module === 'string') candidates.push(pkg.module);
    if (pkg.bin) {
      if (typeof pkg.bin === 'string') candidates.push(pkg.bin);
      else if (typeof pkg.bin === 'object') candidates.push(...Object.values(pkg.bin).filter(Boolean).map(String));
    }
    if (pkg.exports) {
      // Exports can be complex; try common patterns
      if (typeof pkg.exports === 'string') candidates.push(pkg.exports);
      else if (typeof pkg.exports === 'object') {
        for (const val of Object.values(pkg.exports)) {
          if (typeof val === 'string') candidates.push(val);
          else if (val && typeof val === 'object') {
            const v: any = val;
            if (typeof v.require === 'string') candidates.push(v.require);
          }
        }
      }
    }

    for (const c of candidates) {
      const resolved = path.resolve(rootPath, c);
      if (fs.existsSync(resolved)) entryPoints.push(path.relative(rootPath, resolved));
    }

    // scripts.start
    if (pkg.scripts && typeof pkg.scripts.start === 'string') {
      entryPoints.push(`npm start -> ${pkg.scripts.start}`);
    }
  }

  // Common entry files
  for (const candidate of COMMON_ENTRY_FILES) {
    const abs = path.resolve(rootPath, candidate);
    if (fs.existsSync(abs)) entryPoints.push(path.relative(rootPath, abs));
  }

  // Deduplicate
  const uniqueEntryPoints = Array.from(new Set(entryPoints));

  return {
    root: rootPath,
    truncated: truncated ? true : undefined,
    folderStructure: rootNode,
    keyFiles,
    entryPoints: uniqueEntryPoints,
  };
}
