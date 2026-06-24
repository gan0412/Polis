import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Initialize the LegiScan API parameters
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load env variables from parent directory .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize the LegiScan API parameters
const API_KEY = process.env.LEGISCAN_API_KEY;
const BASE_URL = "https://api.legiscan.com/";

if (!API_KEY) {
  console.error("Warning: LEGISCAN_API_KEY environment variable is not set.");
}

// 1. Initialize the MCP server
const server = new McpServer({
  name: "mcp-legiscan",
  version: "1.0.0",
});

// Helper: Make API calls to LegiScan
async function callLegiScan(op, params = {}) {
  if (!API_KEY) {
    throw new Error("LEGISCAN_API_KEY environment variable is missing.");
  }
  const queryParams = new URLSearchParams({
    key: API_KEY,
    op: op,
    ...params,
  });
  
  const response = await fetch(`${BASE_URL}?${queryParams}`);
  const data = await response.json();
  
  if (data.status === "ERROR") {
    throw new Error(`LegiScan API Error: ${data.alert.message || "Unknown error"}`);
  }
  return data;
}

// 2. Register Tool: search_bills
server.registerTool(
  "search_bills",
  "Search for bills in LegiScan based on state and query parameters (e.g. year:2026)",
  {
    state: z.string().length(2).describe("Two-letter state code (e.g., 'NY', 'CA') or 'US' for federal"),
    query: z.string().describe("Search query string (e.g. 'year:2026', 'healthcare')"),
    page: z.number().optional().describe("Page number of search results (default is 1)"),
  },
  async ({ state, query, page = 1 }) => {
    try {
      const data = await callLegiScan("getSearch", { state, query, page });
      return {
        content: [{ type: "text", text: JSON.stringify(data.searchresult || {}, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error searching bills: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// 3. Register Tool: get_bill_details
server.registerTool(
  "get_bill_details",
  "Retrieve detailed status, actions, sponsors, and meta-data for a specific bill by its LegiScan ID",
  {
    bill_id: z.number().describe("The numerical LegiScan bill ID (e.g. 1900581)"),
  },
  async ({ bill_id }) => {
    try {
      const data = await callLegiScan("getBill", { id: bill_id });
      return {
        content: [{ type: "text", text: JSON.stringify(data.bill || {}, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error fetching bill details: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// 4. Register Tool: get_bill_text
server.registerTool(
  "get_bill_text",
  "Fetch the official text of a bill by its document ID (returns base64-encoded document data)",
  {
    doc_id: z.number().describe("The numerical document ID of the bill text"),
  },
  async ({ doc_id }) => {
    try {
      const data = await callLegiScan("getBillText", { id: doc_id });
      return {
        content: [{ type: "text", text: JSON.stringify(data.text || {}, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error fetching bill text: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// 5. Connect to Stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("LegiScan MCP server started successfully!");
