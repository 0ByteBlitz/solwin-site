# solwin-site

The public website for **SolWin**, an on-chain Solana slot where every spin pays SOL or mines the
`$SLW` token, and for `$SLW` itself.

**Live:** https://0byteblitz.github.io/solwin-site/

| Page | |
| --- | --- |
| [Home](https://0byteblitz.github.io/solwin-site/) | How a spin works, the numbers, player protection |
| [$SLW](https://0byteblitz.github.io/solwin-site/slw.html) | Identity, token economics, buyback and burn, live devnet stats |
| [Agents](https://0byteblitz.github.io/solwin-site/agents.html) | Paid jobs for AI agents, machine-readable files |
| [llms.txt](https://0byteblitz.github.io/solwin-site/llms.txt) · [agents.json](https://0byteblitz.github.io/solwin-site/agents.json) | For agents |
| [Play demo](https://0byteblitz.github.io/solwin-site/play/) | The web app (off-chain demo; devnet spins with a wallet) |

Devnet only, play money. Nothing here is real-money gambling or an offer to buy anything.

## How this repo works

This repository holds **built output only**. It's published automatically by CI from the SolWin
source repository on every merge to its `main` branch, and served by GitHub Pages from `main`.
Don't edit files here by hand: the next publish replaces them. Each commit message names the source
commit it was built from.

## Security

Every page carries a strict Content-Security-Policy (no inline code, no third-party scripts; the
only outside connection is the Solana devnet RPC for live stats). To report a vulnerability, open a
private security advisory on this repository rather than a public issue.
