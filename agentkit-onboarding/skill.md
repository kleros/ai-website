---
name: agentkit-onboarding
description: Install Kleros AgentKit (@kleros/agentkit), the CLI/MCP toolkit for the Kleros dispute resolution protocol, and its companion skill. Use when setting up or onboarding onto Kleros AgentKit. Covers installation only — usage guidance comes from the companion skill this installs. Not Coinbase AgentKit.
---

# AgentKit Onboarding

AgentKit (`@kleros/agentkit`) is a token-efficient CLI/MCP toolkit for the Kleros dispute
resolution protocol — courts, disputes, evidence, jurors, PNK stakes, policy documents,
arbitrable-contract classification and issue reporting, on Ethereum, Gnosis, Arbitrum One and
the Arbitrum Sepolia devnet. Not Coinbase AgentKit.

**This skill covers installation only.** The command reference, supported chains, and gotchas
come from the companion skill installed in step 3 — read that once you are set up.

## Quick Start

### 1. Runtime check

#### Ephemeral Sandbox Warning (Claude Cowork / Claude Desktop / Claude Web)

Claude Cowork, Claude Desktop, and Claude Web run shell commands inside an ephemeral sandbox
VM — NOT on the user's local machine.

**If you are running in one of these environments, do NOT run the install yourself.** Instead:

1. **Option A (recommended):** Tell the user to open a terminal on their local machine and run
   the install themselves. Provide the steps (2) and (3) commands verbatim for the user to copy-paste in their terminal.
2. **Option B:** Coming soon — an MCPB extension bundle that installs AgentKit as an MCP server
   on the user's local machine, with no terminal step.

This does NOT apply to Claude Code, Cursor, Codex, Windsurf, OpenClaw, Hermes or other agents
that run shell commands directly on the user's machine.

### 2. CLI installation

```bash
npm install -g @kleros/agentkit@latest
```

Check if installed correctly:

```
kleros --llms
```

### 3. Companion skill installation

```bash
kleros skills add
```

To load the newly installed skills, tell the user to restart their AI client, or run `/reload-skills` if available. 

## Usage Example

### What is the latest Kleros V2 dispute?

1. Get the last dispute ID
```
kleros dispute list --chain arbitrum-one --limit 1 --format json | jq -r '.items[0].id'
```

2. Fetch the dispute state
```
kleros dispute get $disputeID --chain arbitrum-one --format json
```

3. Fetch the dispute data
```
kleros dispute brief $disputeID --depth 2 --chain arbitrum-one --format json
```
