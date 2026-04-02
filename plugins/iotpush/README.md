# iotpush Plugin

Send push notifications, emails, and webhooks via [iotpush.com](https://iotpush.com) — one API call for multi-channel delivery to IoT devices and mobile apps.

## Components

| Component  | Name                        | Purpose                                   |
|------------|-----------------------------|-------------------------------------------|
| MCP Server | `iotpush`                   | Wraps the iotpush REST API as MCP tools   |
| Skill      | `iotpush`                   | Guides Claude on when and how to use the tools |

### MCP Tools

- **send_push_notification** — Send a notification with optional title, priority, tags, and click URL
- **send_json_notification** — Send a JSON-formatted notification for richer payloads
- **send_pushover_notification** — Pushover-compatible endpoint for drop-in replacement

## Setup

### Environment Variables

| Variable                 | Required | Description                                      |
|--------------------------|----------|--------------------------------------------------|
| `IOTPUSH_API_KEY`        | No*      | Bearer token for authenticated requests          |
| `IOTPUSH_DEFAULT_TOPIC`  | No       | Default topic when none is specified in a request |

*Not required for public topics, but recommended for authenticated access.

### Getting Your API Key

1. Create an account at [iotpush.com](https://iotpush.com) or via the mobile app
2. Get your token from the [web panel](https://iotpush.app/get-token) or the mobile app home screen

## Usage

Once installed, just ask Claude things like:

- "Send a push notification to my-topic saying the build is complete"
- "Alert my device that the temperature sensor exceeded 80 degrees — mark it urgent"
- "Send a notification with title 'Deploy Done' and a link to the dashboard"

## Rate Limits

| Plan             | Messages/Month | Topics    |
|------------------|---------------|-----------|
| Free             | 1,000         | 3         |
| Pro ($9/mo)      | 10,000        | 10        |
| Business ($29/mo)| 100,000       | Unlimited |
