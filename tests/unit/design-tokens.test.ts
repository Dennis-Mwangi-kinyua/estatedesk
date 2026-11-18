import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
const tokens = JSON.parse(readFileSync(new URL('../../packages/design-tokens/tokens.json', import.meta.url), 'utf8'));
function luminance(hex: string) {
  const rgb = hex.slice(1).match(/../g)!.map(channel => parseInt(channel, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrast(a: string,b: string) {
  const values = [luminance(a),luminance(b)].sort((x,y) => y-x);
  return (values[0]+.05)/(values[1]+.05);
}
test('web and native generated palettes stay synchronized', () => {
  execFileSync(process.execPath,['scripts/generate-design-tokens.mjs','--check']);
});
for (const mode of ['light','dark']) {
  test(`${mode} text and action pairs meet WCAG AA normal text contrast`, () => {
    const colors = tokens[mode];
    for (const [fg,bg] of [['ink','canvas'],['ink','surface'],['text','surface'],['muted','surface'],['brand','soft'],['onBrand','brand'],['onBrand','brandHover'],['onDanger','danger']]) {
      assert.ok(contrast(colors[fg],colors[bg]) >= 4.5,`${mode} ${fg}/${bg}: ${contrast(colors[fg],colors[bg])}`);
    }
    assert.ok(contrast(colors.input,colors.surface) >= 3, `${mode} input boundary`);
    assert.ok(contrast(colors.ring,colors.canvas) >= 3, `${mode} focus indicator`);
  });
}
