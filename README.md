# dasecure Claude Plugins

A plugin marketplace for Claude Code and Cowork by [dasecure](https://dasecure.com).

## Available Plugins

### iotpush

Send push notifications, emails, and webhooks via [iotpush.com](https://iotpush.com) — one API call for multi-channel delivery to IoT devices and mobile apps.

**Features:**

- Plain text push notifications with optional title, priority, tags, and click URL
- JSON-formatted notifications for richer payloads
- Pushover-compatible endpoint for drop-in replacement

**Setup:**

After installing, set these environment variables:

| Variable | Required | Description |
|---|---|---|
| `IOTPUSH_API_KEY` | Recommended | Bearer token for authenticated requests |
| `IOTPUSH_DEFAULT_TOPIC` | Optional | Default topic when none is specified |

Get your API key at [iotpush.app/get-token](https://iotpush.app/get-token) or from the iotpush mobile app.

## How to Use This Marketplace

Add this marketplace in Claude Code:

```
/plugin marketplace add dasecure/claude-plugins
```

Then install a plugin:

```
/plugin install iotpush@claude-plugins
```

## License

MIT
