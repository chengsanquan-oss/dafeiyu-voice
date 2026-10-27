#!/usr/bin/env node
/**
 * dafeiyu-voice / normalize.mjs
 *
 * 把一段「文章腔」中文文本，转成聊天窗口里的分条消息。
 * 规则与 SKILL.md 的四条硬规则完全一致：
 *
 *   1. ，、；：  → 空格（连续压成一个）
 *   2. 一句一条（按 。！？… 与换行切）
 *   3. 句尾的 。 去掉；？！… 保留
 *   4. 去掉 Markdown 标记（** __ ` # > - *)
 *
 * 用法：
 *   node normalize.mjs "行，那快去睡。别硬撑了。晚安东哥。"
 *   node normalize.mjs --json "……"      # 输出 JSON 数组
 *   node normalize.mjs --self-test       # 跑内置断言
 *
 * 无第三方依赖。
 */

const COMMA_LIKE = /[，、；：]/g;
const SENTENCE_END = /[^。！？!?…\n]+[。！？!?…]*|[。！？!?…]+/g;
const TRAILING_PERIOD = /[。]+$/;
const MARKDOWN_NOISE = [
  /\*\*([^*]+)\*\*/g,   // **bold**
  /__([^_]+)__/g,       // __bold__
  /`([^`]+)`/g,         // `code`
  /^\s{0,3}#{1,6}\s+/gm, // # heading
  /^\s{0,3}>\s?/gm,      // > quote
  /^\s{0,3}[-*+]\s+/gm,  // - bullet
];

/**
 * @param {string} text 原始文本
 * @param {{hardMax?: number, maxBubbles?: number}} [opts]
 * @returns {string[]} 一条一个元素，直接逐条发送
 */
export function toBubbles(text, opts = {}) {
  const hardMax = opts.hardMax ?? 90;
  const maxBubbles = opts.maxBubbles ?? 8;

  if (typeof text !== 'string' || !text.trim()) return [];

  let src = text.replace(/\r\n?/g, '\n');
  // 有捕获组的保留组内容；没有捕获组的（标题/引用/列表符号）整段丢掉。
  // 注意：无捕获组时第二个实参是 offset（数字），所以必须判类型而不是判 undefined。
  for (const re of MARKDOWN_NOISE) src = src.replace(re, (_m, g1) => (typeof g1 === 'string' ? g1 : ''));

  // 1) 逗号类 → 空格
  src = src.replace(COMMA_LIKE, ' ').replace(/[ \t]{2,}/g, ' ').trim();

  // 2) 切句
  const sentences = [];
  for (const raw of src.match(SENTENCE_END) ?? [src]) {
    const s = raw.trim();
    if (s) sentences.push(s);
  }

  // 3) 超长句再按逗号断（此时逗号已变空格，所以按空格断不了就整条保留）
  const out = [];
  for (const s of sentences) {
    if (s.length <= hardMax) { out.push(s); continue; }
    let cur = '';
    for (const seg of s.split(/(?<=[ ])/)) {
      if (!cur) cur = seg;
      else if ((cur + seg).length <= hardMax) cur += seg;
      else { out.push(cur.trim()); cur = seg; }
    }
    if (cur.trim()) out.push(cur.trim());
  }

  // 4) 句尾句号去掉
  return out
    .map((s) => s.replace(TRAILING_PERIOD, '').trim())
    .filter(Boolean)
    .slice(0, maxBubbles);
}

function selfTest() {
  const cases = [
    {
      name: '逗号换空格 + 一条一句 + 去句号',
      input: '行，那快去睡。别又吞两颗褪黑素硬撑，明天上课直接趴下变小肥鱼。晚安东哥。',
      expect: [
        '行 那快去睡',
        '别又吞两颗褪黑素硬撑 明天上课直接趴下变小肥鱼',
        '晚安东哥'
      ]
    },
    {
      name: '问号感叹号保留',
      input: '你真的要这样吗？我说过了！',
      expect: ['你真的要这样吗？', '我说过了！']
    },
    {
      name: '去掉 Markdown',
      input: '**重点**是：别熬夜。\n- 早睡\n- 少喝咖啡',
      expect: ['重点是 别熬夜', '早睡', '少喝咖啡']
    },
    {
      name: '单句不硬拆',
      input: '行那快去睡',
      expect: ['行那快去睡']
    },
    {
      name: '空输入',
      input: '   ',
      expect: []
    }
  ];

  let pass = 0;
  const failures = [];
  for (const c of cases) {
    const got = toBubbles(c.input);
    const ok = JSON.stringify(got) === JSON.stringify(c.expect);
    if (ok) { pass++; console.log(`✅ ${c.name}`); }
    else {
      failures.push(c.name);
      console.log(`❌ ${c.name}\n   期望 ${JSON.stringify(c.expect)}\n   实际 ${JSON.stringify(got)}`);
    }
  }
  console.log(`\n${pass}/${cases.length} 通过`);
  return failures.length === 0;
}

// CLI
const args = process.argv.slice(2);
if (args.includes('--self-test')) {
  process.exit(selfTest() ? 0 : 1);
} else if (args.length) {
  const text = args.filter((a) => !a.startsWith('--')).join(' ');
  const bubbles = toBubbles(text);
  if (args.includes('--json')) {
    console.log(JSON.stringify(bubbles, null, 2));
  } else {
    bubbles.forEach((b, i) => console.log(`${i + 1}. ${b}`));
  }
} else {
  console.log('用法: node normalize.mjs "要转换的文本" [--json] | node normalize.mjs --self-test');
}
