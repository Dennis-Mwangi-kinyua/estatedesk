import fs from "node:fs";

const [gitTmp, pageFn, outDir] = process.argv.slice(2);
const src = fs.readFileSync(gitTmp, "utf8");
const uiStart = process.argv[4] || "function ";
const uiMarker = process.argv[5];

const imports = (src.match(/^([\s\S]*?)export const dynamic/m) || ["", ""])[1].trim();
const start = src.indexOf(`export default async function ${pageFn}`);
if (start === -1) throw new Error(`Missing ${pageFn}`);
const tail = src.slice(start + 1);
const relNext = tail.search(/\nfunction [A-Z]/);
const nextFn = relNext === -1 ? -1 : start + 1 + relNext;
const chunk = nextFn === -1 ? src.slice(start) : src.slice(start, nextFn);
const open = chunk.indexOf("{");
const endMarker = chunk.indexOf("\n}\n\nfunction ");
const bodyEnd = endMarker === -1 ? chunk.lastIndexOf("\n}") : endMarker;
const body = chunk.slice(open + 1, bodyEnd);
const retMatch = [...body.matchAll(/\n {2}return \(/g)].pop();
const retIdx = retMatch ? retMatch.index + 1 : body.lastIndexOf("return (");
const pre = body.slice(0, retIdx).trim();
const jsx = body.slice(retIdx + "return (".length).replace(/\);\s*$/, "");

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(`${outDir}/pre.txt`, pre);
fs.writeFileSync(`${outDir}/jsx.txt`, jsx);
fs.writeFileSync(`${outDir}/imports.txt`, imports);

if (uiMarker) {
  const ui = src
    .slice(src.indexOf(uiMarker), src.indexOf("export default"))
    .replace(/\nfunction /g, "\nexport function ");
  fs.writeFileSync(`${outDir}/ui.tsx`, `${ui}\n`);
}

console.log("pre", pre.split("\n").length, "jsx", jsx.split("\n").length);