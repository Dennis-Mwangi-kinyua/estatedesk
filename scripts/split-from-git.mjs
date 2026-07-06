#!/usr/bin/env node
/**
 * Generic splitter: git original -> _lib/helpers, _components/*-ui, *-workspace, thin page
 * Usage: node scripts/split-from-git.mjs <config-json-path>
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const cfg = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

function gitOriginal(rel) {
  return execSync(`git show 'HEAD:${rel}'`, { encoding: "utf8", cwd: root });
}

function write(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return content.split("\n").length;
}

function exportFns(block) {
  return block
    .replace(/\nfunction /g, "\nexport function ")
    .replace(/\nasync function /g, "\nexport async function ");
}

const src = gitOriginal(cfg.path);
const imports = (src.match(/^([\s\S]*?)export const dynamic/m) || ["", ""])[1].trim();

if (cfg.helpersStart) {
  const end = cfg.helpersEnd || "export default";
  write(
    cfg.helpersOut,
    `${exportFns(src.slice(src.indexOf(cfg.helpersStart), src.indexOf(end)))}\n`,
  );
}

if (cfg.uiStart) {
  write(
    cfg.uiOut,
    `${exportFns(src.slice(src.indexOf(cfg.uiStart), src.indexOf(cfg.uiEnd || "export default")))}\n`,
  );
}

const pageRe = new RegExp(
  `export default async function ${cfg.pageFn}[\\s\\S]*?return \\(([\\s\\S]*)\\);\\s*\\n\\}\\s*$`,
);
const pageMatch = src.match(pageRe);
if (!pageMatch) throw new Error(`Cannot parse page ${cfg.path}`);
const jsx = pageMatch[1];

const preRe = new RegExp(
  `export default async function ${cfg.pageFn}[\\s\\S]*?\\{([\\s\\S]*?)return \\(`,
);
const pre = src.match(preRe)[1].trim();

write(
  cfg.workspaceOut,
  `${cfg.workspaceImports}

export type ${cfg.workspacePropsType} = ${cfg.workspaceProps};

export function ${cfg.workspaceName}(props: ${cfg.workspacePropsType}) {
${cfg.workspaceDestructure || ""}
  return (
${jsx}
  );
}
`,
);

write(
  cfg.path,
  `${imports}

${cfg.pageImports}
export const dynamic = "force-dynamic";

export default async function ${cfg.pageFn}(${cfg.pageArgs}) {
${cfg.guard || ""}${cfg.pageBody || pre}

  return <${cfg.workspaceName} ${cfg.workspacePass} />;
}
`,
);

if (cfg.queriesOut && cfg.queriesContent) {
  write(cfg.queriesOut, cfg.queriesContent);
}

if (cfg.splitMarker) {
  const wsPath = path.join(root, cfg.workspaceOut);
  const ws = fs.readFileSync(wsPath, "utf8");
  const idx = ws.indexOf(cfg.splitMarker);
  if (idx !== -1) {
    const fnPos = ws.indexOf("export function ");
    const retPos = ws.indexOf("  return (", fnPos);
    const preamble = ws.slice(0, retPos + "  return (".length);
    const innerStart = ws.indexOf("(", retPos) + 1;
    const innerEnd = ws.lastIndexOf(");");
    const inner = ws.slice(innerStart, innerEnd);
    const splitAt = inner.indexOf(cfg.splitMarker);
    const kebab = (n) =>
      n.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    const a = inner.slice(0, splitAt);
    const b = inner.slice(splitAt);
    write(
      cfg.workspaceOut.replace("workspace.tsx", `${kebab(cfg.splitA)}.tsx`),
      `${preamble}\n    <>\n${a}    </>\n  );\n}\n`,
    );
    write(
      cfg.workspaceOut.replace("workspace.tsx", `${kebab(cfg.splitB)}.tsx`),
      `${preamble.replace(/export function \w+/, `export function ${cfg.splitB}`)}\n    <>\n${b}    </>\n  );\n}\n`,
    );
    write(
      cfg.workspaceOut,
      `${ws.slice(0, fnPos)}import { ${cfg.splitA} } from "./${kebab(cfg.splitA)}";
import { ${cfg.splitB} } from "./${kebab(cfg.splitB)}";
${ws.slice(fnPos, ws.indexOf("export type"))}export type ${cfg.workspacePropsType} = ${cfg.workspaceProps};

export function ${cfg.workspaceName}(props: ${cfg.workspacePropsType}) {
  return (
    <div className="${cfg.splitWrapperClass || "space-y-5"}">
      <${cfg.splitA} {...props} />
      <${cfg.splitB} {...props} />
    </div>
  );
}
`,
    );
  }
}

console.log("Split complete:", cfg.path);
for (const f of cfg.count || []) {
  console.log(" ", f, fs.readFileSync(path.join(root, f), "utf8").split("\n").length);
}