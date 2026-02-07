#!/bin/bash
# Discord Webhook Helper for NEAR Notifications
# Usage: ./discord-webhook.sh <webhook_url> <json_payload>
#    or: ./discord-webhook.sh --config <channel> <json_payload>

set -e

CONFIG_DIR="${HOME}/.openclaw/near-discord"
CONFIG_FILE="${CONFIG_DIR}/config.json"

# Color codes for embeds (decimal)
COLOR_BLUE=3447003      # Transfers
COLOR_PURPLE=10181046   # Staking
COLOR_ORANGE=15105570   # Contracts
COLOR_GREEN=3066993     # Activity
COLOR_RED=15158332      # Errors
COLOR_GOLD=15844367     # Warnings

# Get webhook URL from config
get_webhook() {
    local channel="${1:-default}"
    if [[ -f "$CONFIG_FILE" ]]; then
        jq -r ".webhooks.${channel} // .webhooks.default // empty" "$CONFIG_FILE"
    fi
}

# Send raw payload to webhook
send_webhook() {
    local webhook_url="$1"
    local payload="$2"
    
    if [[ -z "$webhook_url" ]]; then
        echo "Error: No webhook URL provided" >&2
        return 1
    fi
    
    curl -s -H "Content-Type: application/json" \
         -X POST \
         -d "$payload" \
         "$webhook_url"
}

# Create embed for transfer notification
create_transfer_embed() {
    local from="$1"
    local to="$2"
    local amount="$3"
    local tx_hash="$4"
    local timestamp="${5:-$(date -u +%Y-%m-%dT%H:%M:%S.000Z)}"
    
    cat <<EOF
{
  "embeds": [{
    "title": "🔄 Large NEAR Transfer",
    "description": "**${amount} Ⓝ** transferred",
    "color": ${COLOR_BLUE},
    "fields": [
      {"name": "From", "value": "\`${from}\`", "inline": true},
      {"name": "To", "value": "\`${to}\`", "inline": true},
      {"name": "Amount", "value": "${amount} Ⓝ", "inline": true},
      {"name": "Transaction", "value": "[View on Explorer](https://nearblocks.io/txns/${tx_hash})", "inline": false}
    ],
    "footer": {"text": "NEAR Blockchain • Transfer Alert"},
    "timestamp": "${timestamp}"
  }]
}
EOF
}

# Create embed for staking event
create_staking_embed() {
    local action="$1"      # stake, unstake, claim_rewards
    local account="$2"
    local validator="$3"
    local amount="$4"
    local tx_hash="$5"
    local timestamp="${6:-$(date -u +%Y-%m-%dT%H:%M:%S.000Z)}"
    
    local emoji="📍"
    case "$action" in
        stake) emoji="📍" ;;
        unstake) emoji="📤" ;;
        claim*) emoji="💰" ;;
    esac
    
    cat <<EOF
{
  "embeds": [{
    "title": "${emoji} Staking Event: ${action^}",
    "description": "**${amount} Ⓝ** ${action}d",
    "color": ${COLOR_PURPLE},
    "fields": [
      {"name": "Account", "value": "\`${account}\`", "inline": true},
      {"name": "Validator", "value": "\`${validator}\`", "inline": true},
      {"name": "Amount", "value": "${amount} Ⓝ", "inline": true},
      {"name": "Transaction", "value": "[View on Explorer](https://nearblocks.io/txns/${tx_hash})", "inline": false}
    ],
    "footer": {"text": "NEAR Blockchain • Staking Alert"},
    "timestamp": "${timestamp}"
  }]
}
EOF
}

# Create embed for contract interaction
create_contract_embed() {
    local account="$1"
    local contract="$2"
    local method="$3"
    local gas_used="$4"
    local tx_hash="$5"
    local timestamp="${6:-$(date -u +%Y-%m-%dT%H:%M:%S.000Z)}"
    
    cat <<EOF
{
  "embeds": [{
    "title": "📜 Contract Interaction",
    "description": "Method \`${method}\` called",
    "color": ${COLOR_ORANGE},
    "fields": [
      {"name": "Account", "value": "\`${account}\`", "inline": true},
      {"name": "Contract", "value": "\`${contract}\`", "inline": true},
      {"name": "Method", "value": "\`${method}\`", "inline": true},
      {"name": "Gas Used", "value": "${gas_used} TGas", "inline": true},
      {"name": "Transaction", "value": "[View on Explorer](https://nearblocks.io/txns/${tx_hash})", "inline": false}
    ],
    "footer": {"text": "NEAR Blockchain • Contract Alert"},
    "timestamp": "${timestamp}"
  }]
}
EOF
}

# Create embed for general activity
create_activity_embed() {
    local account="$1"
    local action_type="$2"
    local details="$3"
    local tx_hash="$4"
    local timestamp="${5:-$(date -u +%Y-%m-%dT%H:%M:%S.000Z)}"
    
    cat <<EOF
{
  "embeds": [{
    "title": "📊 Account Activity",
    "description": "${action_type}",
    "color": ${COLOR_GREEN},
    "fields": [
      {"name": "Account", "value": "\`${account}\`", "inline": true},
      {"name": "Details", "value": "${details}", "inline": false},
      {"name": "Transaction", "value": "[View on Explorer](https://nearblocks.io/txns/${tx_hash})", "inline": false}
    ],
    "footer": {"text": "NEAR Blockchain • Activity Alert"},
    "timestamp": "${timestamp}"
  }]
}
EOF
}

# Create custom embed
create_custom_embed() {
    local title="$1"
    local message="$2"
    local color_name="${3:-blue}"
    local timestamp="${4:-$(date -u +%Y-%m-%dT%H:%M:%S.000Z)}"
    
    local color=$COLOR_BLUE
    case "$color_name" in
        blue) color=$COLOR_BLUE ;;
        purple) color=$COLOR_PURPLE ;;
        orange) color=$COLOR_ORANGE ;;
        green) color=$COLOR_GREEN ;;
        red) color=$COLOR_RED ;;
        gold|yellow) color=$COLOR_GOLD ;;
    esac
    
    cat <<EOF
{
  "embeds": [{
    "title": "${title}",
    "description": "${message}",
    "color": ${color},
    "footer": {"text": "NEAR Notifications"},
    "timestamp": "${timestamp}"
  }]
}
EOF
}

# Create test embed
create_test_embed() {
    local timestamp="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
    
    cat <<EOF
{
  "embeds": [{
    "title": "✅ Webhook Test Successful",
    "description": "Your Discord webhook is configured correctly!",
    "color": ${COLOR_GREEN},
    "fields": [
      {"name": "Status", "value": "Connected", "inline": true},
      {"name": "Service", "value": "NEAR Notifications", "inline": true}
    ],
    "footer": {"text": "OpenClaw • NEAR Discord Notifications"},
    "timestamp": "${timestamp}"
  }]
}
EOF
}

# Main command handling
case "${1:-}" in
    --transfer)
        shift
        payload=$(create_transfer_embed "$@")
        webhook=$(get_webhook "transfers")
        send_webhook "$webhook" "$payload"
        ;;
    --staking)
        shift
        payload=$(create_staking_embed "$@")
        webhook=$(get_webhook "staking")
        send_webhook "$webhook" "$payload"
        ;;
    --contract)
        shift
        payload=$(create_contract_embed "$@")
        webhook=$(get_webhook "contracts")
        send_webhook "$webhook" "$payload"
        ;;
    --activity)
        shift
        payload=$(create_activity_embed "$@")
        webhook=$(get_webhook "activity")
        send_webhook "$webhook" "$payload"
        ;;
    --custom)
        shift
        payload=$(create_custom_embed "$@")
        webhook=$(get_webhook "default")
        send_webhook "$webhook" "$payload"
        ;;
    --test)
        payload=$(create_test_embed)
        webhook="${2:-$(get_webhook 'default')}"
        send_webhook "$webhook" "$payload"
        ;;
    --config)
        channel="$2"
        payload="$3"
        webhook=$(get_webhook "$channel")
        send_webhook "$webhook" "$payload"
        ;;
    *)
        # Direct webhook URL and payload
        send_webhook "$1" "$2"
        ;;
esac
