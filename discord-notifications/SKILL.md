# Discord NEAR Notifications

---
name: discord-near-notifications
version: 1.0.0
description: Webhook-based NEAR blockchain notifications for Discord
author: OpenClaw
tags: [near, discord, notifications, blockchain, monitoring]
commands:
  - near_discord_setup
  - near_discord_alert
  - near_discord_watch
---

## Overview

Send NEAR blockchain notifications to Discord channels via webhooks. No bot hosting required — just configure webhook URLs and start receiving alerts.

## Features

- **Webhook-based** — No bot token or hosting needed
- **Rich embeds** — Transaction details with color-coded status
- **Configurable thresholds** — Set minimum amounts for alerts
- **Multiple channels** — Route different alert types to different channels
- **Alert types**: Large transfers, staking events, contract interactions, account activity

## Configuration

Config stored in: `~/.openclaw/near-discord/config.json`

```json
{
  "webhooks": {
    "default": "https://discord.com/api/webhooks/...",
    "transfers": "https://discord.com/api/webhooks/...",
    "staking": "https://discord.com/api/webhooks/..."
  },
  "thresholds": {
    "large_transfer": "100",
    "staking_event": "10"
  },
  "accounts": ["account.near", "wallet.near"],
  "alerts": {
    "transfers": true,
    "staking": true,
    "contracts": true,
    "activity": true
  }
}
```

## Commands

### near_discord_setup

Configure Discord webhook integration.

```bash
# Set default webhook
near_discord_setup --webhook "https://discord.com/api/webhooks/..."

# Add channel-specific webhook
near_discord_setup --webhook "https://..." --channel transfers

# Set thresholds
near_discord_setup --threshold large_transfer=100

# Add accounts to monitor
near_discord_setup --account wallet.near

# Enable/disable alert types
near_discord_setup --enable staking
near_discord_setup --disable contracts
```

### near_discord_alert

Send a one-off notification or test the webhook.

```bash
# Test webhook
near_discord_alert --test

# Send custom alert
near_discord_alert --title "Price Alert" --message "NEAR hit $10!" --color green

# Send transaction notification
near_discord_alert --tx <tx_hash>
```

### near_discord_watch

Start monitoring accounts for activity.

```bash
# Watch configured accounts
near_discord_watch

# Watch specific account
near_discord_watch --account wallet.near

# Watch with custom interval (seconds)
near_discord_watch --interval 30

# Watch in background
near_discord_watch --background
```

## Alert Types

### Large Transfers
Triggered when NEAR transfers exceed the configured threshold.
- Shows: sender, receiver, amount, tx hash
- Color: Blue (#3498db)

### Staking Events  
Triggered for stake, unstake, and reward claims.
- Shows: validator, action type, amount, epoch
- Color: Purple (#9b59b6)

### Contract Interactions
Triggered when monitored accounts call contracts.
- Shows: contract, method, args preview, gas used
- Color: Orange (#e67e22)

### Account Activity
General account activity notifications.
- Shows: action type, details, timestamp
- Color: Green (#2ecc71)

## Discord Embed Format

```json
{
  "embeds": [{
    "title": "🔄 Large Transfer",
    "description": "100 NEAR transferred",
    "color": 3447003,
    "fields": [
      {"name": "From", "value": "sender.near", "inline": true},
      {"name": "To", "value": "receiver.near", "inline": true},
      {"name": "Amount", "value": "100 Ⓝ", "inline": true}
    ],
    "footer": {"text": "NEAR Blockchain"},
    "timestamp": "2026-02-07T16:00:00.000Z"
  }]
}
```

## Getting a Discord Webhook URL

1. Open Discord and go to your server
2. Right-click the channel → **Edit Channel**
3. Go to **Integrations** → **Webhooks**
4. Click **New Webhook** or use existing
5. Copy the **Webhook URL**

## NEAR RPC Endpoints

Default: `https://rpc.mainnet.near.org`

For testnet: `https://rpc.testnet.near.org`

Configure with:
```bash
near_discord_setup --rpc https://rpc.mainnet.near.org
```

## Examples

### Monitor whale movements
```bash
near_discord_setup --webhook "https://discord.com/api/webhooks/..." --channel transfers
near_discord_setup --threshold large_transfer=10000
near_discord_setup --account whales.near
near_discord_watch --background
```

### Staking notifications
```bash
near_discord_setup --webhook "https://discord.com/api/webhooks/..." --channel staking
near_discord_setup --enable staking
near_discord_setup --account mystaking.near
near_discord_watch
```

## Files

- `scripts/discord-webhook.sh` — Send webhooks to Discord
- `scripts/near-monitor.sh` — Monitor NEAR accounts via RPC
- `scripts/watch-daemon.sh` — Background watcher process
