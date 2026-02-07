#!/bin/bash
# NEAR Discord Setup Script
# Configures webhooks, thresholds, and accounts

set -e

CONFIG_DIR="${HOME}/.openclaw/near-discord"
CONFIG_FILE="${CONFIG_DIR}/config.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Initialize config
init_config() {
    mkdir -p "$CONFIG_DIR"
    
    if [[ ! -f "$CONFIG_FILE" ]]; then
        cat > "$CONFIG_FILE" <<EOF
{
  "webhooks": {
    "default": ""
  },
  "thresholds": {
    "large_transfer": "100",
    "staking_event": "10"
  },
  "accounts": [],
  "alerts": {
    "transfers": true,
    "staking": true,
    "contracts": true,
    "activity": true
  },
  "rpc": "https://rpc.mainnet.near.org"
}
EOF
        echo "Created config file: $CONFIG_FILE"
    fi
}

# Get config value
get_config() {
    jq -r "$1" "$CONFIG_FILE"
}

# Set config value
set_config() {
    local key="$1"
    local value="$2"
    local tmp=$(mktemp)
    jq "$key = $value" "$CONFIG_FILE" > "$tmp" && mv "$tmp" "$CONFIG_FILE"
}

# Add to array in config
add_to_array() {
    local key="$1"
    local value="$2"
    local tmp=$(mktemp)
    jq "${key} += [\"${value}\"] | ${key} |= unique" "$CONFIG_FILE" > "$tmp" && mv "$tmp" "$CONFIG_FILE"
}

# Remove from array in config
remove_from_array() {
    local key="$1"
    local value="$2"
    local tmp=$(mktemp)
    jq "${key} -= [\"${value}\"]" "$CONFIG_FILE" > "$tmp" && mv "$tmp" "$CONFIG_FILE"
}

# Show current config
show_config() {
    echo "=== NEAR Discord Notifications Config ==="
    echo ""
    echo "Webhooks:"
    jq -r '.webhooks | to_entries[] | "  \(.key): \(.value[:50])..."' "$CONFIG_FILE" 2>/dev/null || echo "  (none)"
    echo ""
    echo "Thresholds:"
    jq -r '.thresholds | to_entries[] | "  \(.key): \(.value) NEAR"' "$CONFIG_FILE"
    echo ""
    echo "Monitored Accounts:"
    jq -r '.accounts[] // "(none)"' "$CONFIG_FILE" | sed 's/^/  /'
    echo ""
    echo "Alerts Enabled:"
    jq -r '.alerts | to_entries[] | "  \(.key): \(.value)"' "$CONFIG_FILE"
    echo ""
    echo "RPC Endpoint:"
    echo "  $(get_config '.rpc')"
    echo ""
    echo "Config file: $CONFIG_FILE"
}

# Test webhook
test_webhook() {
    local channel="${1:-default}"
    local webhook=$(get_config ".webhooks.${channel}")
    
    if [[ -z "$webhook" ]] || [[ "$webhook" == "null" ]]; then
        echo "Error: No webhook configured for channel: $channel"
        exit 1
    fi
    
    echo "Testing webhook for channel: $channel"
    "$SCRIPT_DIR/discord-webhook.sh" --test "$webhook"
    echo "Test message sent!"
}

# Parse arguments
init_config

while [[ $# -gt 0 ]]; do
    case "$1" in
        --webhook)
            webhook_url="$2"
            channel="${3:-default}"
            if [[ "$3" == "--channel" ]]; then
                channel="$4"
                shift 2
            fi
            set_config ".webhooks.${channel}" "\"${webhook_url}\""
            echo "Set webhook for channel: $channel"
            shift 2
            ;;
        --channel)
            # Handled with --webhook
            shift 2
            ;;
        --threshold)
            IFS='=' read -r name value <<< "$2"
            set_config ".thresholds.${name}" "\"${value}\""
            echo "Set threshold ${name} = ${value} NEAR"
            shift 2
            ;;
        --account)
            add_to_array ".accounts" "$2"
            echo "Added account: $2"
            shift 2
            ;;
        --remove-account)
            remove_from_array ".accounts" "$2"
            echo "Removed account: $2"
            shift 2
            ;;
        --enable)
            set_config ".alerts.${2}" "true"
            echo "Enabled alerts for: $2"
            shift 2
            ;;
        --disable)
            set_config ".alerts.${2}" "false"
            echo "Disabled alerts for: $2"
            shift 2
            ;;
        --rpc)
            set_config ".rpc" "\"$2\""
            echo "Set RPC endpoint: $2"
            shift 2
            ;;
        --test)
            test_webhook "${2:-default}"
            shift
            [[ "${2:-}" != --* ]] && shift
            ;;
        --show|--status)
            show_config
            shift
            ;;
        --help|-h)
            cat <<EOF
NEAR Discord Notifications Setup

Usage: $0 [options]

Options:
  --webhook <url> [--channel <name>]  Set webhook URL (default channel: "default")
  --threshold <name>=<value>          Set alert threshold in NEAR
  --account <account.near>            Add account to monitor
  --remove-account <account.near>     Remove account from monitoring
  --enable <type>                     Enable alert type (transfers, staking, contracts, activity)
  --disable <type>                    Disable alert type
  --rpc <url>                         Set NEAR RPC endpoint
  --test [channel]                    Send test notification
  --show, --status                    Show current configuration
  --help, -h                          Show this help

Examples:
  # Set up webhook
  $0 --webhook "https://discord.com/api/webhooks/..."

  # Set threshold for large transfers (100 NEAR)
  $0 --threshold large_transfer=100

  # Add account to monitor
  $0 --account wallet.near

  # Send test notification
  $0 --test
EOF
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# If no arguments, show config
if [[ $# -eq 0 ]] && [[ "${1:-}" == "" ]]; then
    show_config
fi
