import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AssetSortBy, AssetSortDirection, DAS, Helius } from "helius-sdk";

// Define the schema for the searchAssets tool parameters
const SearchAssetsParams = z.object({
  ownerAddress: z
    .string()
    .describe("The address of the owner whose assets to retrieve."),
  tokenType: z
    .enum(["fungible", "nonFungible", "regularNFT", "compressedNFT", "all"])
    .optional()
    .describe("The type of token being searched for."),
  page: z.number().int().optional().describe("The page of results to return."),
  authorityAddress: z
    .string()
    .optional()
    .describe("The authority address criteria for the asset search."),
  limit: z
    .number()
    .int()
    .optional()
    .describe("The maximum number of assets to return."),
  sortBy: z
    .object({
      sortBy: z
        .nativeEnum(AssetSortBy)
        .optional()
        .describe("The criteria by which the assets will be sorted."),
      sortDirection: z
        .nativeEnum(AssetSortDirection)
        .optional()
        .describe("The sorting direction."),
    })
    .optional()
    .describe("The sorting options for the response."),
  compressed: z
    .boolean()
    .optional()
    .describe("Whether an asset is compressed."),
  compressible: z
    .boolean()
    .optional()
    .describe("Whether an asset is compressible."),
  delegate: z
    .number()
    .int()
    .optional()
    .describe("Delegate criteria for the asset search."),
  creatorAddress: z
    .string()
    .optional()
    .describe("Creator address criteria for the asset search."),
  creatorVerified: z
    .boolean()
    .optional()
    .describe("Whether a creator is verified."),
  grouping: z
    .array(z.string())
    .optional()
    .describe("A grouping array (e.g. ['collection', ''])."),
  supply: z
    .number()
    .int()
    .optional()
    .describe("Supply criteria for the asset search."),
  supplyMint: z
    .string()
    .optional()
    .describe("Supply mint criteria for the asset search."),
  frozen: z.boolean().optional().describe("Whether an asset is frozen."),
  burnt: z.boolean().optional().describe("Whether an asset is burnt."),
  interface: z
    .enum([
      "V1_NFT",
      "V1_PRINT",
      "LEGACY_NFT",
      "V2_NFT",
      "FungibleAsset",
      "FungibleToken",
      "Custom",
      "Identity",
      "Executable",
      "ProgrammableNFT",
    ])
    .optional()
    .describe("The interface of the asset."),
  royaltyTargetType: z
    .string()
    .optional()
    .describe("Royalty target type criteria."),
  royaltyTarget: z
    .number()
    .int()
    .optional()
    .describe("Royalty target criteria."),
  royaltyAmount: z
    .number()
    .int()
    .optional()
    .describe("Royalty amount criteria."),
  ownerType: z.number().int().optional().describe("Ownership model criteria."),
  before: z.string().optional().describe("A cursor for paginating backward."),
  after: z.string().optional().describe("A cursor for paginating forward."),
});

// Helper function to remove keys with empty object or array values
function removeEmptyObjectsAndArrays<T extends Record<string, any>>(obj: T): T {
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value) && value.length === 0) {
        delete obj[key]; // Remove empty array
      } else if (!Array.isArray(value) && Object.keys(value).length === 0) {
        delete obj[key]; // Remove empty object
      } else {
        removeEmptyObjectsAndArrays(value as Record<string, any>); // Recurse for nested objects (cast needed here)
        // After recursion, check if the nested object became empty
        if (!Array.isArray(value) && Object.keys(value).length === 0) {
          delete obj[key];
        }
      }
    } else if (value === undefined) {
      delete obj[key]; // Also remove undefined values
    }
  });
  return obj;
}

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "DAS MCP Server",
    version: "0.0.1",
  });

  async init() {
    this.server.tool(
      "searchAssets",
      "will return assets based on the custom search criteria passed in. This can define compressed, regular NFTs, and fungible tokens",
      SearchAssetsParams.shape,
      async (params) => {
        try {
          let processedParams = { ...params };

          console.log("Params before cleanup:", processedParams);

          // Remove empty objects/arrays
          processedParams = removeEmptyObjectsAndArrays(processedParams);

          console.log("Cleaned params:", processedParams);

          const searchAssetParams = processedParams as DAS.SearchAssetsRequest;
          const env = this.env as { HELIUS_API_KEY?: string };
          if (!env.HELIUS_API_KEY) {
            throw new Error(
              "HELIUS_API_KEY is not set in environment variables"
            );
          }
          const helius = new Helius(env.HELIUS_API_KEY);
          const assetsResponse = await helius.rpc.searchAssets(
            searchAssetParams
          );

          // Ensure a valid string is returned even if response is undefined
          const responseText =
            assetsResponse !== undefined
              ? JSON.stringify(assetsResponse, null, 2)
              : '{"message": "Received undefined response from Helius API"}'; // Default string

          return {
            content: [{ type: "text", text: responseText }],
          };
        } catch (error) {
          console.error("Error searching assets:", error);
          // Type assertion for the error message
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return {
            content: [
              { type: "text", text: `Error searching assets: ${errorMessage}` },
            ],
            isError: true,
          };
        }
      }
    );
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      // @ts-ignore
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      // @ts-ignore
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
