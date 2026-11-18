import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const base = 'apps/web/src';
const walk = folder => fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => entry.isDirectory() && !["node_modules", ".next", "dist"].includes(entry.name) ? walk(`${folder}/${entry.name}`) : /\.(ts|tsx)$/.test(entry.name) ? [`${folder}/${entry.name}`] : []);
const files = [...walk(base), ...walk("packages"), ...walk("services")];
const options = ts.readConfigFile("apps/web/tsconfig.json", ts.sys.readFile).config.compilerOptions;
const compilerOptions = ts.convertCompilerOptionsFromJson(options, path.resolve("apps/web")).options;
const fileSet = new Set(files);
const graph = new Map();
const violations = [];
for (const file of files) {
  const ast = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const refs = [];
  const runtimeRefs = new Set();
  const visit = node => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const ref = node.moduleSpecifier.text;
      refs.push(ref);
      const clause = ts.isImportDeclaration(node) ? node.importClause : null;
      const bindings = clause?.namedBindings;
      const onlyTypes = node.isTypeOnly || clause?.isTypeOnly || (!clause?.name && bindings && ts.isNamedImports(bindings) && bindings.elements.length > 0 && bindings.elements.every(item => item.isTypeOnly));
      if (!onlyTypes) runtimeRefs.add(ref);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) { refs.push(node.arguments[0].text); runtimeRefs.add(node.arguments[0].text); }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  const edges = [];
  for (const ref of refs) {
    const target = ref.startsWith('@/') ? `${base}/${ref.slice(2)}` : ref.startsWith('.') ? path.posix.normalize(`${path.posix.dirname(file)}/${ref}`) : null;
    const resolvedPath = ts.resolveModuleName(ref, path.resolve(file), compilerOptions, ts.sys).resolvedModule?.resolvedFileName;
    const resolved = resolvedPath ? path.relative(root, resolvedPath).split(path.sep).join("/") : target && [target, `${target}.ts`, `${target}.tsx`, `${target}/index.ts`, `${target}/index.tsx`].find(value => fileSet.has(value));
    if (resolved && fileSet.has(resolved) && runtimeRefs.has(ref)) edges.push(resolved);
    if ((file.startsWith("packages/") || file.startsWith("services/")) && resolved?.startsWith(base)) violations.push(`shared-to-web: ${file} -> ${resolved}`);
    if (file.startsWith(`${base}/lib/`) && resolved?.startsWith(`${base}/app/`)) violations.push(`lib-to-route: ${file} -> ${resolved}`);
    if (/\/features\/[^/]+\/domain\//.test(file) && (ref.startsWith('@/') || ref.startsWith('next') || ref.includes('prisma') || ref.includes('../application') || ref.includes('../infrastructure'))) violations.push(`domain-boundary: ${file} -> ${ref}`);
    if (/\/features\/[^/]+\/application\//.test(file) && (ref.startsWith('@/') || ref.startsWith('next') || ref.includes('prisma') || ref.includes('infrastructure'))) violations.push(`application-boundary: ${file} -> ${ref}`);
    if (/\/features\/[^/]+\/infrastructure\//.test(file) && (resolved?.startsWith(`${base}/app/`) || resolved?.startsWith(`${base}/components/`))) violations.push(`infrastructure-boundary: ${file} -> ${ref}`);
    if (file.includes('/app/(app)/dashboard/support/') && ref === '@/lib/prisma') violations.push(`support-route-database: ${file}`);
  }
  graph.set(file, edges);
}
// Tarjan's algorithm records existing strongly connected components for a ratchet.
let sequence = 0;
const indices = new Map(), lows = new Map(), stack = [], active = new Set();
function visit(file) {
  indices.set(file, sequence); lows.set(file, sequence++); stack.push(file); active.add(file);
  for (const edge of graph.get(file) ?? []) {
    if (!indices.has(edge)) { visit(edge); lows.set(file, Math.min(lows.get(file), lows.get(edge))); }
    else if (active.has(edge)) lows.set(file, Math.min(lows.get(file), indices.get(edge)));
  }
  if (lows.get(file) === indices.get(file)) {
    const component = []; let node;
    do { node = stack.pop(); active.delete(node); component.push(node); } while (node !== file);
    if (component.length > 1 || graph.get(file)?.includes(file)) violations.push(`cycle: ${component.sort().join(' -> ')}`);
  }
}
for (const file of files) if (!indices.has(file)) visit(file);
violations.sort();
const baselinePath = path.join(root, 'docs/architecture/legacy-boundaries.json');
if (process.argv.includes('--record-baseline')) { fs.writeFileSync(baselinePath, JSON.stringify(violations, null, 2) + '\n'); console.log(`Recorded ${violations.length} legacy boundary findings.`); }
else {
  const baseline = new Set(JSON.parse(fs.readFileSync(baselinePath, 'utf8')));
  const added = violations.filter(value => !baseline.has(value));
  if (added.length) { console.error(added.join('\n')); process.exitCode = 1; }
  else console.log(`Architecture checks passed: ${files.length} modules; ${violations.length} documented legacy findings, no new violations.`);
}
