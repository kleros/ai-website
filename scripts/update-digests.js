#!/usr/bin/env node

// Sync .well-known/agent-skills/index.json with the skill files it points at:
// the sha256 `digest` of each artifact, and — for `type: "skill-md"` entries —
// the `description`, which the RFC says SHOULD match the SKILL.md frontmatter.
//
//   node scripts/update-digests.js
//
// A stale digest makes conforming clients reject the skill outright; a stale
// description misroutes agents at discovery time, before they fetch anything.
//
// `name` is the entry's identity, so a mismatch is reported and NOT rewritten.
// Node stdlib only. Ported from kleros/kleros-skills/scripts/update-digests.js.

const { readFileSync, writeFileSync } = require("fs");
const { createHash } = require("crypto");
const { resolve } = require("path");

const ROOT = resolve(__dirname, "..");
const INDEX_PATH = resolve(ROOT, ".well-known/agent-skills/index.json");

// Reads `name` and `description` out of a SKILL.md YAML frontmatter block.
//
// This is a deliberately narrow parser, not a YAML implementation. It scans
// line by line and gives up the moment the block stops looking like simple
// frontmatter — a markdown `---` rule further down the file is an exact match
// for the closing delimiter, so anything laxer will happily read body prose as
// metadata. Only plain single-line scalars are synced; block scalars, quoted
// strings, anchors, tags, flow collections and folded continuations are all
// reported and skipped. Writing a half-parsed value into the index is worse
// than leaving a stale one there for a human to notice.
function readFrontmatter(text, label) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const warn = (message) => console.log(`  WARN  ${label} — ${message}`);

  if (lines[0] !== "---") {
    warn("no YAML frontmatter, description not synced");
    return null;
  }

  const entries = [];
  let closed = false;
  let stoppedAt = null;
  for (let i = 1; i < lines.length && !closed; i++) {
    const line = lines[i];
    const key = line.match(/^([A-Za-z0-9_-]+):(?:[ \t]+(.*))?$/);
    if (line === "---") closed = true;
    else if (key) entries.push({ key: key[1], value: key[2] ?? "", folded: false });
    else if (line.startsWith("#")) continue;
    else if (/^(?:[ \t]+\S|- )/.test(line) && entries.length) entries[entries.length - 1].folded = true;
    else {
      stoppedAt = line.trim(); // a blank line, or anything else: no longer frontmatter
      break;
    }
  }
  if (!closed) {
    warn(stoppedAt
      ? `frontmatter line \`${stoppedAt.slice(0, 40)}\` is not \`key: value\`, description not synced`
      : "frontmatter is not closed by `---`, description not synced");
    return null;
  }

  const fields = {};
  for (const key of ["name", "description"]) {
    const matches = entries.filter((entry) => entry.key === key);
    if (matches.length === 0) {
      warn(`frontmatter has no \`${key}\``);
      continue;
    }
    if (matches.length > 1) {
      warn(`\`${key}\` appears ${matches.length} times, not synced`);
      continue;
    }
    const entry = matches[0];
    if (entry.folded) {
      warn(`\`${key}\` continues onto the next line, not synced; keep it on one line`);
      continue;
    }

    // A plain scalar ends at an unquoted ` #` comment, as it would in YAML.
    const raw = entry.value.trim();
    const value = raw.startsWith("#") ? "" : raw.replace(/\s+#.*$/, "").trim();
    if (value !== raw) warn(`\`${key}\` has a trailing \`#\` comment; syncing the value without it`);

    if (value === "") warn(`\`${key}\` is empty, not synced`);
    else if (/^[|>][0-9+-]*$/.test(value)) warn(`\`${key}\` is a block scalar, not synced`);
    else if (/^["']/.test(value)) warn(`\`${key}\` is quoted, not synced; use a plain scalar`);
    else if (/^[-?:,\[\]{}#&*!|>'"%@`]/.test(value) || /:\s/.test(value) || value.endsWith(":"))
      warn(`\`${key}\` is not plain YAML text, not synced; keep it unquoted, on one line, with no \`: \``);
    else fields[key] = value;
  }
  return fields;
}

const index = JSON.parse(readFileSync(INDEX_PATH, "utf8"));
let changed = 0;

for (const skill of index.skills) {
  const urlPath = new URL(skill.url, "https://ai.kleros.io").pathname;
  const filePath = resolve(ROOT, urlPath.replace(/^\//, ""));

  let content;
  try {
    content = readFileSync(filePath);
  } catch {
    console.log(`  SKIP  ${skill.name} — ${urlPath} not found`);
    continue;
  }

  const updates = [];

  const fresh = `sha256:${createHash("sha256").update(content).digest("hex")}`;
  if (skill.digest !== fresh) {
    const from = skill.digest ? `${String(skill.digest).slice(0, 20)}… → ` : "";
    updates.push(`digest ${from}${fresh.slice(0, 20)}…`);
    skill.digest = fresh;
  }

  // Archives carry their SKILL.md inside the bundle, so there is nothing to
  // read here without unpacking — digest only.
  if (skill.type === "skill-md") {
    const fm = readFrontmatter(content.toString("utf8"), skill.name);
    if (fm) {
      if (fm.name && fm.name !== skill.name) {
        console.log(`  WARN  ${skill.name} — frontmatter name is \`${fm.name}\`; not rewritten, fix one by hand`);
      }
      if (fm.description && fm.description !== skill.description) {
        updates.push("description");
        skill.description = fm.description;
      }
    }
  }

  if (updates.length === 0) {
    console.log(`  OK    ${skill.name}`);
  } else {
    console.log(`  UPD   ${skill.name}  ${updates.join("; ")}`);
    changed++;
  }
}

if (changed > 0) {
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + "\n");
  console.log(`\n${changed} skill(s) updated in ${INDEX_PATH}`);
} else {
  console.log("\nIndex is up to date.");
}
