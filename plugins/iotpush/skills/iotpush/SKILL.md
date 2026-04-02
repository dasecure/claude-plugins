---
name: iotpush
description: >
  This skill should be used when the user asks to "send a push notification",
  "notify my device", "send an alert", "push a message", "send a webhook",
  "notify via iotpush", or needs help with IoT push notifications, device alerts,
  or the iotpush API.
metadata:
  version: "0.1.0"
---

# iotpush Notification Skill

Send push notifications, emails, and webhooks through the iotpush API. One API call delivers across channels.

## Available MCP Tools

Three tools are available via the `iotpush` MCP server:

### send_push_notification
Send a notification to a topic using plain text with optional headers. Best for simple, quick alerts.

Parameters:
- `topic` (string) — target topic/channel (falls back to default if not set)
- `message` (string, required) — the notification body
- `title` (string) — notification title
- `priority` (string) — `low`, `normal`, `high`, or `urgent`
- `tags` (string) — comma-separated tags like `warning,sensor`
- `click_url` (string) — URL to open on tap/click

### send_json_notification
Send a notification with a JSON payload for richer control.

Parameters:
- `topic` (string) — target topic/channel
- `message` (string, required) — notification body
- `title` (string) — notification title
- `priority` (string) — `low`, `normal`, `high`, or `urgent`

### send_pushover_notification
Send via the Pushover-compatible endpoint. Use when integrating with apps that have built-in Pushover support.

Parameters:
- `token` (string) — iotpush topic API key (falls back to env var)
- `user` (string) — topic name
- `message` (string, required) — notification body
- `title` (string) — notification title
- `url` (string) — URL to include
- `priority` (integer) — Pushover-style: -2 (lowest) to 2 (urgent)

## Usage Guidelines

1. For simple alerts, prefer `send_push_notification` — it's the most straightforward.
2. Use `send_json_notification` when the user wants structured payloads.
3. Use `send_pushover_notification` only when Pushover compatibility is specifically needed.
4. Always confirm the topic and message content with the user before sending.
5. If no topic is specified, ask the user — do not guess.
6. Map urgency language to priorities: "urgent"/"critical" → `urgent`, "important" → `high`, casual → `normal` or `low`.

## Rate Limits

- **Free**: 1,000 messages/month, 3 topics
- **Pro** ($9/mo): 10,000 messages/month, 10 topics
- **Business** ($29/mo): 100,000 messages/month, unlimited topics

Warn users if they mention high-volume sending that might exceed their plan limits.
