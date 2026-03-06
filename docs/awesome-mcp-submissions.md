# Awesome MCP List Submissions

Ready-to-submit PR content for getting CobroYa listed on major MCP server directories.

---

## 1. punkpeye/awesome-mcp-servers

> Repository: https://github.com/punkpeye/awesome-mcp-servers
> Stars: 5k+
> The biggest community-curated list of MCP servers.

### File to edit

`README.md` -- add to the **Finance & Fintech** section (`### 💰 <a name="finance--fintech"></a>Finance & Fintech`).

Insert alphabetically (after entries starting with "C" / before entries starting with "D"):

### Exact line to add

```markdown
- [dan1d/cobroya](https://github.com/dan1d/mercadopago-tool) 📇 ☁️ 🍎 🪟 🐧 - Mercado Pago payments for AI agents — create payment links, search payments, and issue refunds. Built for LATAM merchants. `npx cobroya-mcp`
```

Legend key for the icons used:
- `📇` = TypeScript codebase
- `☁️` = Cloud Service (talks to Mercado Pago remote API)
- `🍎 🪟 🐧` = macOS, Windows, Linux

### PR title

```
Add CobroYa - Mercado Pago payments MCP server for LATAM
```

### PR description

```markdown
## What does this server do?

CobroYa is an MCP server that connects AI agents to [Mercado Pago](https://www.mercadopago.com), the leading payment platform in Latin America (400M+ users across Argentina, Brazil, Mexico, Colombia, Chile, and more).

**Tools provided:**
- `create_payment_link` -- Generate Mercado Pago checkout links with line items
- `search_payments` -- Query payment history with filters (status, date range, reference)
- `get_payment_details` -- Retrieve full details for a specific payment
- `refund_payment` -- Issue full or partial refunds
- `get_account_balance` -- Check available and pending balances

**Install:**
```
npx cobroya-mcp
```

**npm:** [cobroya](https://www.npmjs.com/package/cobroya)

**Category:** Finance & Fintech

Built with the official `@modelcontextprotocol/sdk`. MIT licensed.
```

---

## 2. modelcontextprotocol/servers

> Repository: https://github.com/modelcontextprotocol/servers
> Maintained by: Anthropic / MCP steering group

### Important note

As of early 2025, this repository is focused on **reference implementations** only. The README states:

> "The server lists in this README are no longer maintained and will eventually be removed."
> "If you are looking for a list of MCP servers, you can browse published servers on the MCP Registry."

The recommended path is to **publish to the MCP Registry** instead:
- Registry URL: https://registry.modelcontextprotocol.io/

### Option A: Submit to the MCP Registry (Recommended)

Publish the package to the MCP Registry by ensuring the `package.json` contains the `mcpName` field (already present: `"mcpName": "io.github.dan1d/cobroya"`), then register at https://registry.modelcontextprotocol.io/.

### Option B: PR to the README (Third-Party Community Servers section)

If the community servers list is still accepting entries, add to the **Community Servers** section.

### File to edit

`README.md` -- under `## 🤝 Third-Party Servers` > `### 🎖️ Official Integrations` or an appropriate community subsection.

### Exact line to add

```markdown
- **[CobroYa](https://github.com/dan1d/mercadopago-tool)** - Mercado Pago payments for AI agents -- create payment links, search payments, and issue refunds. Built for LATAM merchants.
```

### PR title

```
Add CobroYa - Mercado Pago MCP server
```

### PR description

```markdown
## Summary

Adds CobroYa, a community MCP server for Mercado Pago payment integration.

- **npm:** `cobroya` (`npx cobroya-mcp`)
- **SDK:** Built with `@modelcontextprotocol/sdk`
- **Tools:** 5 tools (create payment links, search payments, get details, refund, check balance)
- **License:** MIT

Mercado Pago is the dominant payment platform in Latin America. This server enables AI agents to handle payment workflows for LATAM merchants.
```

---

## 3. Smithery.ai

> Website: https://smithery.ai
> A searchable MCP server registry with install-button UX.

### How to publish

Smithery uses a `smithery.yaml` configuration file in the root of your repository. Steps:

1. **Create `smithery.yaml`** in the repo root (see `docs/smithery.yaml` in this project for the ready-to-use file).

2. **Go to** https://smithery.ai/new and submit the GitHub repository URL:
   ```
   https://github.com/dan1d/mercadopago-tool
   ```

3. Smithery will auto-detect the `smithery.yaml` and parse the server configuration.

4. Fill in any additional metadata on the Smithery web form:
   - **Name:** CobroYa
   - **Description:** Mercado Pago payments for AI agents -- create payment links, search payments, issue refunds. Built for LATAM merchants.
   - **Category:** Payments / Finance
   - **Tags:** mercadopago, payments, latam, argentina, fintech, checkout

5. Submit for listing.

### Config file

See `/docs/smithery.yaml` (created alongside this document).

---

## Submission checklist

- [ ] **punkpeye/awesome-mcp-servers** -- Fork, add line to Finance & Fintech, open PR
- [ ] **MCP Registry** -- Register at registry.modelcontextprotocol.io (preferred over modelcontextprotocol/servers repo)
- [ ] **modelcontextprotocol/servers** -- Optional: PR to README if community list is still active
- [ ] **Smithery.ai** -- Copy `smithery.yaml` to repo root, submit at smithery.ai/new
- [ ] **glama.ai** -- The awesome-mcp-servers list syncs to https://glama.ai/mcp/servers automatically once merged
