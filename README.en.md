# dafeiyu-voice

Make an AI's replies feel like a human texting.

Not "cute". Not "personality". Just: when it lands in WeChat, QQ, or Telegram, it doesn't read like a chatbot.

```
Before: 行，那快去睡。别又吞两颗褪黑素硬撑，明天上课直接趴下变小肥鱼。晚安东哥。
After:  行 那快去睡
        别又吞两颗褪黑素硬撑 明天上课直接趴下变小肥鱼
        晚安东哥
```

Same information. Same words. One reads like prose, the other like a chat.

---

## What it actually changes

Four hard rules, all **typography**, none about personality:

| # | Rule | Why |
|---|---|---|
| 1 | `，、；：` → space | The Chinese comma is a *written* mark. People break clauses with spaces on a phone |
| 2 | One sentence per bubble (split on `。！？…`) | Nobody packs three thoughts into one bubble |
| 3 | Drop the trailing `。`, keep `？！…` | A full stop reads like a memo. Question and exclamation marks carry tone |
| 4 | No Markdown | `**bold**` and `- lists` either don't render in chat or look wildly out of place |

Plus four tone rules: short clauses, 1–3 bubbles per turn, never explain yourself, never use support-desk phrasing.

Full rules in [SKILL.md](SKILL.md). Real before/after cases in [references/examples.md](references/examples.md).

---

## Usage

### As a Claude skill

Drop the folder into your skills directory (or install the packaged `.skill`). It triggers on phrases like "talk like a person", "send it in separate messages", "stop sounding like an AI" — and on any task whose output will be read on a phone.

```
dafeiyu-voice/
├── SKILL.md              # the rules
├── references/
│   └── examples.md       # six before/after cases, three ways to break it
├── scripts/
│   └── normalize.mjs     # deterministic converter (optional)
└── evals/
    └── evals.json        # test prompts
```

### As a plain prompt

Copy the "怎么改：四条硬规则" section of `SKILL.md` into your system prompt. No tooling needed.

### As a library (Node)

```bash
node scripts/normalize.mjs "行，那快去睡。别硬撑了。晚安东哥。"
```

```
1. 行 那快去睡
2. 别硬撑了
3. 晚安东哥
```

```js
import { toBubbles } from './scripts/normalize.mjs';

const bubbles = toBubbles(modelReply, { hardMax: 90, maxBubbles: 8 });
for (const [i, text] of bubbles.entries()) {
  await send(text);
  if (i < bubbles.length - 1) await sleep(1000 + Math.random() * 2000); // typing cadence
}
```

No dependencies. Node 18+.

```bash
node scripts/normalize.mjs --self-test   # 5/5 passing
```

---

## Three ways people break it

1. **Over-chopping** — splitting by character count instead of meaning. `硬撑` alone in a bubble is worse than one long message.
2. **Under-splitting** — three thoughts still crammed into one bubble because splitting "feels short". Splitting is for readability, not brevity.
3. **Seasoning as food** — `呀~` `啦~` `哦~` on every clause. Reads more fake than the support-desk voice it replaced.

All three are shown concretely in `references/examples.md`.

---

## When *not* to use it

- The user asked for a list, a table, or code — match the requested form; don't sacrifice information for style.
- Docs, emails, PR descriptions — those *should* be prose.
- The user is upset, in a hurry, or discussing something serious — drop the playfulness, be clear.

---

## Name

"大肥鱼" (Big Fat Fish) is a fan nickname for DeepSeek's blue-whale mascot. These rules were tuned while working on a QQ persona — seven or eight rounds of revision, and these four were what survived.

No technical relation to the whale. The name was just memorable.

---

## License

MIT.
