#!/usr/bin/env node

/**
 * iotpush MCP Server
 *
 * Exposes iotpush.com API endpoints as MCP tools for Claude.
 * Supports: push notifications, JSON payloads, Pushover-compatible API.
 *
 * Environment variables:
 *   IOTPUSH_API_KEY        - Bearer token for authenticated requests (optional for public topics)
 *   IOTPUSH_DEFAULT_TOPIC  - Default topic if none specified (optional)
 */

const https = require("https");
const readline = require("readline");

const BASE_URL = "https://www.iotpush.com";
const API_KEY = process.env.IOTPUSH_API_KEY || "";
const DEFAULT_TOPIC = process.env.IOTPUSH_DEFAULT_TOPIC || "";

// ── MCP Protocol Helpers ──

let requestId = 0;

function jsonrpcResponse(id, result) {
  return JSON.stringify({ jsonrpc: "2.0", id, result });
}

function jsonrpcError(id, code, message) {
  return JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } });
}

// ── HTTP Helper ──

function httpRequest(path, { method = "POST", headers = {}, body = "" } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        ...headers,
        "User-Agent": "iotpush-mcp/0.1.0",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

// ── Tool Definitions ──

const TOOLS = [
  {
    name: "send_push_notification",
    description:
      "Send a push notification to a topic via iotpush. Supports plain text or rich notifications with title, priority, tags, and click URL.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description:
            "The topic/channel to send the notification to (e.g. 'my-topic'). If omitted, uses the default topic from environment.",
        },
        message: {
          type: "string",
          description: "The notification message body.",
        },
        title: {
          type: "string",
          description: "Optional notification title.",
        },
        priority: {
          type: "string",
          enum: ["low", "normal", "high", "urgent"],
          description:
            "Notification priority level. Defaults to 'normal' if omitted.",
        },
        tags: {
          type: "string",
          description:
            "Comma-separated tags for the notification (e.g. 'warning,sensor').",
        },
        click_url: {
          type: "string",
          description: "URL to open when the notification is clicked.",
        },
      },
      required: ["message"],
    },
  },
  {
    name: "send_json_notification",
    description:
      "Send a notification using a full JSON payload for maximum control over all fields.",
    inputSchema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description:
            "The topic/channel to send the notification to. If omitted, uses the default topic.",
        },
        title: {
          type: "string",
          description: "Notification title.",
        },
        message: {
          type: "string",
          description: "Notification message body.",
        },
        priority: {
          type: "string",
          enum: ["low", "normal", "high", "urgent"],
          description: "Notification priority.",
        },
      },
      required: ["message"],
    },
  },
  {
    name: "send_pushover_notification",
    description:
      "Send a notification using the Pushover-compatible API endpoint. Use this if integrating with apps or services that have built-in Pushover support.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description:
            "Your iotpush topic API key. If omitted, uses IOTPUSH_API_KEY from environment.",
        },
        user: {
          type: "string",
          description:
            "Topic name (optional if token is unique to a topic).",
        },
        message: {
          type: "string",
          description: "The notification message.",
        },
        title: {
          type: "string",
          description: "Notification title.",
        },
        url: {
          type: "string",
          description: "URL to include in the notification.",
        },
        priority: {
          type: "integer",
          minimum: -2,
          maximum: 2,
          description:
            "Pushover-style priority: -2 (lowest), -1 (low), 0 (normal), 1 (high), 2 (urgent).",
        },
      },
      required: ["message"],
    },
  },
];

// ── Tool Handlers ──

async function handleSendPushNotification(args) {
  const topic = args.topic || DEFAULT_TOPIC;
  if (!topic) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: "Error: No topic specified and no default topic configured. Provide a 'topic' parameter or set IOTPUSH_DEFAULT_TOPIC.",
        },
      ],
    };
  }

  const headers = { "Content-Type": "text/plain" };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;
  if (args.title) headers["Title"] = args.title;
  if (args.priority) headers["Priority"] = args.priority;
  if (args.tags) headers["Tags"] = args.tags;
  if (args.click_url) headers["Click"] = args.click_url;

  const res = await httpRequest(`/api/push/${encodeURIComponent(topic)}`, {
    headers,
    body: args.message,
  });

  return {
    content: [
      {
        type: "text",
        text: `Notification sent to topic "${topic}" (HTTP ${res.status}).\nResponse: ${res.body}`,
      },
    ],
  };
}

async function handleSendJsonNotification(args) {
  const topic = args.topic || DEFAULT_TOPIC;
  if (!topic) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: "Error: No topic specified and no default topic configured.",
        },
      ],
    };
  }

  const headers = { "Content-Type": "application/json" };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

  const payload = {};
  if (args.title) payload.title = args.title;
  if (args.message) payload.message = args.message;
  if (args.priority) payload.priority = args.priority;

  const res = await httpRequest(`/api/push/${encodeURIComponent(topic)}`, {
    headers,
    body: JSON.stringify(payload),
  });

  return {
    content: [
      {
        type: "text",
        text: `JSON notification sent to topic "${topic}" (HTTP ${res.status}).\nResponse: ${res.body}`,
      },
    ],
  };
}

async function handleSendPushoverNotification(args) {
  const token = args.token || API_KEY;
  if (!token) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: "Error: No token provided and no IOTPUSH_API_KEY configured.",
        },
      ],
    };
  }

  const formParts = [];
  formParts.push(`token=${encodeURIComponent(token)}`);
  if (args.user) formParts.push(`user=${encodeURIComponent(args.user)}`);
  formParts.push(`message=${encodeURIComponent(args.message)}`);
  if (args.title) formParts.push(`title=${encodeURIComponent(args.title)}`);
  if (args.url) formParts.push(`url=${encodeURIComponent(args.url)}`);
  if (args.priority !== undefined)
    formParts.push(`priority=${args.priority}`);

  const headers = { "Content-Type": "application/x-www-form-urlencoded" };

  const res = await httpRequest("/api/1/messages.json", {
    headers,
    body: formParts.join("&"),
  });

  return {
    content: [
      {
        type: "text",
        text: `Pushover-compatible notification sent (HTTP ${res.status}).\nResponse: ${res.body}`,
      },
    ],
  };
}

// ── MCP Message Router ──

async function handleMessage(msg) {
  const { id, method, params } = msg;

  switch (method) {
    case "initialize":
      return jsonrpcResponse(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "iotpush", version: "0.1.0" },
      });

    case "notifications/initialized":
      return null; // No response needed

    case "tools/list":
      return jsonrpcResponse(id, { tools: TOOLS });

    case "tools/call": {
      const { name, arguments: args } = params;
      try {
        let result;
        switch (name) {
          case "send_push_notification":
            result = await handleSendPushNotification(args);
            break;
          case "send_json_notification":
            result = await handleSendJsonNotification(args);
            break;
          case "send_pushover_notification":
            result = await handleSendPushoverNotification(args);
            break;
          default:
            return jsonrpcError(id, -32601, `Unknown tool: ${name}`);
        }
        return jsonrpcResponse(id, result);
      } catch (err) {
        return jsonrpcResponse(id, {
          isError: true,
          content: [{ type: "text", text: `Error: ${err.message}` }],
        });
      }
    }

    default:
      return jsonrpcError(id, -32601, `Method not found: ${method}`);
  }
}

// ── stdio Transport ──

const rl = readline.createInterface({ input: process.stdin });
let buffer = "";

process.stdin.on("data", (chunk) => {
  buffer += chunk.toString();
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);
    if (line) {
      try {
        const msg = JSON.parse(line);
        handleMessage(msg).then((response) => {
          if (response) {
            process.stdout.write(response + "\n");
          }
        });
      } catch (err) {
        process.stderr.write(`Parse error: ${err.message}\n`);
      }
    }
  }
});

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
