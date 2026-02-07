# Discord NEAR Notifications

Webhook-based NEAR blockchain notifications for Discord. No bot hosting required.

## Quick Start

```bash
# 1. Configure webhook
./scripts/setup.sh --webhook "https://discord.com/api/webhooks/..."

# 2. Add accounts to monitor
./scripts/setup.sh --account yourwallet.near

# 3. Test the webhook
./scripts/setup.sh --test

# 4. Start watching
./scripts/watch-daemon.sh
```

## Commands

### Setup (`near_discord_setup`)
```bash
# Via setup.sh
./scripts/setup.sh --webhook "https://discord.com/api/webhooks/..."
./scripts/setup.sh --threshold large_transfer=100
./scripts/setup.sh --account wallet.near
./scripts/setup.sh --enable staking
./scripts/setup.sh --show
```

### Alert (`near_discord_alert`)
```bash
# Via discord-webhook.sh
./scripts/discord-webhook.sh --test
./scripts/discord-webhook.sh --custom "Title" "Message" green
./scripts/discord-webhook.sh --transfer "sender.near" "receiver.near" "100" "tx_hash"
```

### Watch (`near_discord_watch`)
```bash
# Via watch-daemon.sh
./scripts/watch-daemon.sh                    # Foreground
./scripts/watch-daemon.sh --background       # Background daemon
./scripts/watch-daemon.sh --interval 30      # Custom interval
./scripts/watch-daemon.sh --status           # Check daemon status
./scripts/watch-daemon.sh --stop             # Stop daemon
```

## Alert Types

| Type | Trigger | Color |
|------|---------|-------|
| Transfers | NEAR transfers > threshold | Blue |
| Staking | Stake/unstake/claim events | Purple |
| Contracts | Function calls to contracts | Orange |
| Activity | General account activity | Green |

## Configuration

Config file: `~/.openclaw/near-discord/config.json`

See `examples/config.example.json` for reference.

## Getting a Discord Webhook

1. Open Discord → Server Settings
2. Integrations → Webhooks → New Webhook
3. Choose channel, copy URL

## Files

```
discord-notifications/
├── SKILL.md              # Skill documentation
├── README.md             # This file
├── examples/
│   └── config.example.json
└── scripts/
    ├── setup.sh          # near_discord_setup
    ├── discord-webhook.sh # near_discord_alert
    ├── near-monitor.sh   # Account monitoring
    └── watch-daemon.sh   # near_discord_watch
```

## License

MIT
