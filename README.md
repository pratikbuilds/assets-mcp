# DAS MCP Server on Cloudflare Workers

This project is a Cloudflare Worker that runs a Model Context Protocol (MCP) server, integrating with the Helius API to provide asset search and related tools. It is designed for easy deployment and extension, and uses environment variables for secure API key management.

## Features

- Cloudflare Worker MCP server
- Integrates with Helius API (requires `HELIUS_API_KEY`)
- Secure environment variable handling (no secrets in code or repo)
- Ready for Cloudflare AI Playground and Claude Desktop integration

## Environment Variables

**Required:**

- `HELIUS_API_KEY` — Your Helius API key (get from https://helius.dev)

### Local Development

1. Create a `.dev.vars` file in the project root:
   ```
   HELIUS_API_KEY=your-helius-api-key
   ```
2. Add `.dev.vars` to `.gitignore` (already done if using template).
3. Run locally with:
   ```bash
   npx wrangler dev
   ```

### Cloudflare Deployment

1. Go to your Worker in the Cloudflare Dashboard.
2. Under **Settings > Variables**, add `HELIUS_API_KEY` with your API key value.
3. Deploy your Worker as usual.

**Troubleshooting:**

- If you see an error like `HELIUS_API_KEY is not set in environment variables`, make sure the variable is set in your local `.dev.vars` or in the Cloudflare dashboard.

## Usage

- The Worker exposes endpoints for MCP tools, including asset search via Helius.
- See `src/index.ts` for tool definitions and extension points.

## Get started:

[![Deploy to Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless)

This will deploy your MCP server to a URL like: `remote-mcp-server-authless.<your-account>.workers.dev/sse`

Alternatively, you can use the command line below to get the remote MCP Server created on your local machine:

```bash
npm create cloudflare@latest -- my-mcp-server --template=cloudflare/ai/demos/remote-mcp-authless
```

## Customizing your MCP Server

To add your own [tools](https://developers.cloudflare.com/agents/model-context-protocol/tools/) to the MCP server, define each tool inside the `init()` method of `src/index.ts` using `this.server.tool(...)`.

## Connect to Cloudflare AI Playground

You can connect to your MCP server from the Cloudflare AI Playground, which is a remote MCP client:

1. Go to https://playground.ai.cloudflare.com/
2. Enter your deployed MCP server URL (`remote-mcp-server-authless.<your-account>.workers.dev/sse`)
3. You can now use your MCP tools directly from the playground!

## Connect Claude Desktop to your MCP server

You can also connect to your remote MCP server from local MCP clients, by using the [mcp-remote proxy](https://www.npmjs.com/package/mcp-remote).

To connect to your MCP server from Claude Desktop, follow [Anthropic's Quickstart](https://modelcontextprotocol.io/quickstart/user) and within Claude Desktop go to Settings > Developer > Edit Config.

Update with this configuration:

```json
{
  "mcpServers": {
    "calculator": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"  // or remote-mcp-server-authless.your-account.workers.dev/sse
      ]
    }
  }
}
```

Restart Claude and you should see the tools become available.
