import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const [inputFile, pageFn, outDir, uiMarker] = process.argv.slice(2);
if (!inputFile || !pageFn || !outDir) {
  throw new Error("Usage: node scripts/extract-page-parts.mjs <input.tsx> <page-function> <output-directory> [ui-marker]");
}

const src = fs.readFileSync(inputFile, "utf8");
const source = ts.createSourceFile(inputFile, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
if (source.parseDiagnostics.length) {
  throw new Error(ts.flattenDiagnosticMessageText(source.parseDiagnostics[0].messageText, "\n"));
}
const page = source.statements.find(statement =>
  ts.isFunctionDeclaration(statement) && statement.name?.text === pageFn &&
  statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword) &&
  statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword),
);
if (!page?.body) throw new Error(`Missing default async page function ${pageFn}`);

// Typed/destructured parameters, nested callbacks and JSX braces must not
// affect the boundaries of the actual function body and its return value.
const returned = [...page.body.statements].reverse().find(statement => ts.isReturnStatement(statement));
if (!returned?.expression) throw new Error(`Missing page return expression in ${pageFn}`);
let expression = returned.expression;
while (ts.isParenthesizedExpression(expression)) expression = expression.expression;
const pre = src.slice(page.body.getStart(source) + 1, returned.getFullStart()).trim();
const jsx = expression.getText(source);
const imports = source.statements.filter(statement => ts.isImportDeclaration(statement) || ts.isImportEqualsDeclaration(statement)).map(statement => statement.getText(source)).join("\n");

let ui;
if (uiMarker) {
  const markerStart = src.indexOf(uiMarker);
  if (markerStart < 0 || markerStart >= page.getStart(source)) throw new Error("UI marker must exist before the page function");
  const helpers = source.statements.filter(statement => statement.getStart(source) >= markerStart && statement.end <= page.getStart(source));
  if (!helpers.length || helpers[0].getStart(source) !== markerStart) throw new Error("UI marker must start a top-level declaration");
  ui = helpers.map(statement => {
    const text = statement.getText(source);
    return ts.isFunctionDeclaration(statement) && !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) ? `export ${text}` : text;
  }).join("\n\n");
}

// Validate every boundary before creating or changing output files.
fs.mkdirSync(outDir, { recursive: true });
for (const [name, text] of Object.entries({ "pre.txt": pre, "jsx.txt": jsx, "imports.txt": imports, ...(ui === undefined ? {} : { "ui.tsx": `${ui}\n` }) })) {
  fs.writeFileSync(path.join(outDir, name), text);
}

console.log("pre", pre.split("\n").length, "jsx", jsx.split("\n").length);
