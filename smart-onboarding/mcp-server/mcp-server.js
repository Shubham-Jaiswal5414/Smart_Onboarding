#!/usr/bin/env node
/**
 * OpenMetadata MCP Server
 * Smart Dataset Onboarding Assistant
 * WeMakeDevs × OpenMetadata Hackathon 2026
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const OM_HOST = process.env.OM_HOST || "http://localhost:8585";
const OM_TOKEN = process.env.OM_TOKEN || "";

const headers = {
  "Content-Type": "application/json",
  ...(OM_TOKEN ? { Authorization: `Bearer ${OM_TOKEN}` } : {}),
};

async function omFetch(path, method = "GET", body = null) {
  const res = await fetch(`${OM_HOST}/api/v1${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`OpenMetadata API ${res.status}: ${await res.text()}`);
  return res.json();
}

const server = new Server(
  { name: "openmetadata-onboarding", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_table",
      description: "Fetch a table's metadata by fully qualified name",
      inputSchema: { type: "object", properties: { fqn: { type: "string" } }, required: ["fqn"] }
    },
    {
      name: "list_tables",
      description: "List tables in OpenMetadata",
      inputSchema: { type: "object", properties: { limit: { type: "number" } } }
    },
    {
      name: "patch_table_description",
      description: "Update the description of a table",
      inputSchema: { type: "object", properties: { table_id: { type: "string" }, description: { type: "string" } }, required: ["table_id", "description"] }
    },
    {
      name: "add_tags_to_table",
      description: "Add classification tags to a table",
      inputSchema: { type: "object", properties: { table_id: { type: "string" }, tags: { type: "array", items: { type: "string" } } }, required: ["table_id", "tags"] }
    },
    {
      name: "set_table_owner",
      description: "Set owner of a table",
      inputSchema: { type: "object", properties: { table_id: { type: "string" }, owner_email: { type: "string" }, owner_type: { type: "string", enum: ["user", "team"] } }, required: ["table_id", "owner_email", "owner_type"] }
    },
    {
      name: "create_quality_test",
      description: "Create a data quality test for a table",
      inputSchema: { type: "object", properties: { table_fqn: { type: "string" }, column: { type: "string" }, test_type: { type: "string" }, params: { type: "object" } }, required: ["table_fqn", "test_type"] }
    },
    {
      name: "full_onboard_table",
      description: "One-shot: apply description, tags, owner, and quality tests",
      inputSchema: {
        type: "object",
        properties: {
          table_id: { type: "string" }, table_fqn: { type: "string" },
          description: { type: "string" }, owner_email: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          quality_checks: { type: "array" }
        },
        required: ["table_id", "table_fqn"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case "get_table": {
        const data = await omFetch(`/tables/name/${encodeURIComponent(args.fqn)}?fields=columns,tags,owner,description`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "list_tables": {
        const data = await omFetch(`/tables?limit=${args.limit || 10}&fields=columns,tags,owner`);
        return { content: [{ type: "text", text: JSON.stringify(data.data, null, 2) }] };
      }
      case "patch_table_description": {
        await omFetch(`/tables/${args.table_id}`, "PATCH", [{ op: "add", path: "/description", value: args.description }]);
        return { content: [{ type: "text", text: `✅ Description updated` }] };
      }
      case "add_tags_to_table": {
        const tagObjects = args.tags.map(t => ({ tagFQN: t, source: "Classification", labelType: "Automated", state: "Suggested" }));
        await omFetch(`/tables/${args.table_id}`, "PATCH", [{ op: "add", path: "/tags", value: tagObjects }]);
        return { content: [{ type: "text", text: `✅ Tags added: ${args.tags.join(", ")}` }] };
      }
      case "set_table_owner": {
        const entityType = args.owner_type === "team" ? "teams" : "users";
        const entity = await omFetch(`/${entityType}/name/${encodeURIComponent(args.owner_email)}`);
        await omFetch(`/tables/${args.table_id}`, "PATCH", [{ op: "add", path: "/owner", value: { id: entity.id, type: args.owner_type } }]);
        return { content: [{ type: "text", text: `✅ Owner set to ${args.owner_email}` }] };
      }
      case "create_quality_test": {
        const testDef = await omFetch(`/dataQuality/testDefinitions/name/${args.test_type}`);
        await omFetch(`/dataQuality/testCases`, "POST", {
          name: `${args.table_fqn}_${args.column || "table"}_${args.test_type}_${Date.now()}`,
          entityLink: args.column ? `<#E::table::${args.table_fqn}::columns::${args.column}>` : `<#E::table::${args.table_fqn}>`,
          testDefinition: { id: testDef.id, type: "testDefinition" },
          parameterValues: args.params ? Object.entries(args.params).map(([n, v]) => ({ name: n, value: String(v) })) : [],
        });
        return { content: [{ type: "text", text: `✅ Quality test created: ${args.test_type}` }] };
      }
      case "full_onboard_table": {
        const results = [];
        if (args.description) {
          await omFetch(`/tables/${args.table_id}`, "PATCH", [{ op: "add", path: "/description", value: args.description }]);
          results.push("✅ Description set");
        }
        if (args.tags?.length) {
          const tagObjects = args.tags.map(t => ({ tagFQN: t, source: "Classification", labelType: "Automated", state: "Suggested" }));
          await omFetch(`/tables/${args.table_id}`, "PATCH", [{ op: "add", path: "/tags", value: tagObjects }]);
          results.push(`✅ Tags applied: ${args.tags.join(", ")}`);
        }
        if (args.quality_checks?.length) {
          for (const qc of args.quality_checks) {
            try {
              const testDef = await omFetch(`/dataQuality/testDefinitions/name/${qc.test_type}`);
              await omFetch(`/dataQuality/testCases`, "POST", {
                name: `${args.table_fqn}_${qc.column || "table"}_${qc.test_type}`,
                entityLink: qc.column ? `<#E::table::${args.table_fqn}::columns::${qc.column}>` : `<#E::table::${args.table_fqn}>`,
                testDefinition: { id: testDef.id, type: "testDefinition" },
                parameterValues: [],
              });
              results.push(`✅ Quality check: ${qc.test_type}`);
            } catch (e) { results.push(`⚠️ Skipped ${qc.test_type}: ${e.message}`); }
          }
        }
        return { content: [{ type: "text", text: results.join("\n") }] };
      }
      default: throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return { content: [{ type: "text", text: `❌ Error: ${error.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("🚀 OpenMetadata MCP Server running on stdio");
