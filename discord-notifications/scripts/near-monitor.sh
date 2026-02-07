#!/bin/bash
# NEAR Account Monitor
# Queries NEAR RPC for account activity and sends Discord notifications

set -e

CONFIG_DIR="${HOME}/.openclaw/near-discord"
CONFIG_FILE="${CONFIG_DIR}/config.json"
STATE_FILE="${CONFIG_DIR}/state.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default RPC endpoint
DEFAULT_RPC="https://rpc.mainnet.near.org"

# Initialize config directory
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
  "rpc": "${DEFAULT_RPC}"
}
EOF
    fi
    
    if [[ ! -f "$STATE_FILE" ]]; then
        echo '{"last_checked": {}, "processed_txs": []}' > "$STATE_FILE"
    fi
}

# Get config value
get_config() {
    local key="$1"
    jq -r "$key" "$CONFIG_FILE"
}

# Set config value
set_config() {
    local key="$1"
    local value="$2"
    local tmp=$(mktemp)
    jq "$key = $value" "$CONFIG_FILE" > "$tmp" && mv "$tmp" "$CONFIG_FILE"
}

# Get RPC endpoint
get_rpc() {
    local rpc=$(get_config '.rpc // empty')
    echo "${rpc:-$DEFAULT_RPC}"
}

# NEAR RPC call
near_rpc() {
    local method="$1"
    local params="$2"
    local rpc=$(get_rpc)
    
    curl -s -X POST "$rpc" \
        -H "Content-Type: application/json" \
        -d "{\"jsonrpc\": \"2.0\", \"id\": \"monitor\", \"method\": \"${method}\", \"params\": ${params}}"
}

# Get account state
get_account_state() {
    local account="$1"
    near_rpc "query" "{\"request_type\": \"view_account\", \"finality\": \"final\", \"account_id\": \"${account}\"}"
}

# Get recent transactions for account using NEAR Blocks API
get_recent_txs() {
    local account="$1"
    local limit="${2:-25}"
    
    # Use nearblocks.io API for transaction history
    curl -s "https://api.nearblocks.io/v1/account/${account}/txns?per_page=${limit}" \
        -H "Accept: application/json"
}

# Parse yoctoNEAR to NEAR (24 decimals)
yocto_to_near() {
    local yocto="$1"
    # Remove quotes if present
    yocto="${yocto//\"/}"
    
    if [[ ${#yocto} -le 24 ]]; then
        echo "0"
    else
        # Get integer part (remove last 24 digits)
        local len=${#yocto}
        local int_part="${yocto:0:$((len-24))}"
        echo "$int_part"
    fi
}

# Check if transaction was already processed
is_processed() {
    local tx_hash="$1"
    jq -e ".processed_txs | index(\"${tx_hash}\")" "$STATE_FILE" > /dev/null 2>&1
}

# Mark transaction as processed
mark_processed() {
    local tx_hash="$1"
    local tmp=$(mktemp)
    # Keep only last 1000 processed txs to prevent file bloat
    jq ".processed_txs = ([\"${tx_hash}\"] + .processed_txs)[:1000]" "$STATE_FILE" > "$tmp" && mv "$tmp" "$STATE_FILE"
}

# Process a transfer action
process_transfer() {
    local account="$1"
    local tx="$2"
    
    local tx_hash=$(echo "$tx" | jq -r '.transaction_hash')
    local from=$(echo "$tx" | jq -r '.predecessor_account_id // .signer_account_id')
    local to=$(echo "$tx" | jq -r '.receiver_account_id')
    local deposit=$(echo "$tx" | jq -r '.actions[0].deposit // "0"')
    
    local amount=$(yocto_to_near "$deposit")
    local threshold=$(get_config '.thresholds.large_transfer // "100"')
    
    if [[ "$amount" -ge "$threshold" ]]; then
        "$SCRIPT_DIR/discord-webhook.sh" --transfer "$from" "$to" "$amount" "$tx_hash"
        echo "[$(date)] Transfer alert: ${amount} NEAR from ${from} to ${to}"
    fi
}

# Process a staking action
process_staking() {
    local account="$1"
    local tx="$2"
    local action_type="$3"  # stake, unstake, claim
    
    local tx_hash=$(echo "$tx" | jq -r '.transaction_hash')
    local validator=$(echo "$tx" | jq -r '.receiver_account_id')
    local deposit=$(echo "$tx" | jq -r '.actions[0].deposit // .actions[0].args.amount // "0"')
    
    local amount=$(yocto_to_near "$deposit")
    local threshold=$(get_config '.thresholds.staking_event // "10"')
    
    if [[ "$amount" -ge "$threshold" ]]; then
        "$SCRIPT_DIR/discord-webhook.sh" --staking "$action_type" "$account" "$validator" "$amount" "$tx_hash"
        echo "[$(date)] Staking alert: ${action_type} ${amount} NEAR with ${validator}"
    fi
}

# Process a contract call
process_contract() {
    local account="$1"
    local tx="$2"
    
    local tx_hash=$(echo "$tx" | jq -r '.transaction_hash')
    local contract=$(echo "$tx" | jq -r '.receiver_account_id')
    local method=$(echo "$tx" | jq -r '.actions[0].method_name // "unknown"')
    local gas=$(echo "$tx" | jq -r '.outcomes.gas_burnt // 0')
    
    # Convert gas to TGas
    local tgas=$((gas / 1000000000000))
    
    "$SCRIPT_DIR/discord-webhook.sh" --contract "$account" "$contract" "$method" "$tgas" "$tx_hash"
    echo "[$(date)] Contract alert: ${account} called ${method} on ${contract}"
}

# Monitor a single account
monitor_account() {
    local account="$1"
    
    echo "[$(date)] Checking account: ${account}"
    
    local txs=$(get_recent_txs "$account" 10)
    
    if [[ -z "$txs" ]] || [[ "$txs" == "null" ]]; then
        echo "[$(date)] No transactions found for ${account}"
        return
    fi
    
    # Check alerts enabled
    local transfers_enabled=$(get_config '.alerts.transfers // true')
    local staking_enabled=$(get_config '.alerts.staking // true')
    local contracts_enabled=$(get_config '.alerts.contracts // true')
    
    echo "$txs" | jq -c '.txns[]? // empty' | while read -r tx; do
        local tx_hash=$(echo "$tx" | jq -r '.transaction_hash')
        
        # Skip if already processed
        if is_processed "$tx_hash"; then
            continue
        fi
        
        local action_kind=$(echo "$tx" | jq -r '.actions[0].action // .actions[0].action_kind // "unknown"')
        
        case "$action_kind" in
            Transfer|TRANSFER)
                [[ "$transfers_enabled" == "true" ]] && process_transfer "$account" "$tx"
                ;;
            Stake|STAKE)
                [[ "$staking_enabled" == "true" ]] && process_staking "$account" "$tx" "stake"
                ;;
            FunctionCall|FUNCTION_CALL)
                local method=$(echo "$tx" | jq -r '.actions[0].method // .actions[0].method_name // ""')
                case "$method" in
                    deposit_and_stake|stake)
                        [[ "$staking_enabled" == "true" ]] && process_staking "$account" "$tx" "stake"
                        ;;
                    unstake|unstake_all)
                        [[ "$staking_enabled" == "true" ]] && process_staking "$account" "$tx" "unstake"
                        ;;
                    withdraw|withdraw_all)
                        [[ "$staking_enabled" == "true" ]] && process_staking "$account" "$tx" "claim"
                        ;;
                    *)
                        [[ "$contracts_enabled" == "true" ]] && process_contract "$account" "$tx"
                        ;;
                esac
                ;;
        esac
        
        mark_processed "$tx_hash"
    done
}

# Monitor all configured accounts
monitor_all() {
    local accounts=$(get_config '.accounts // []')
    
    echo "$accounts" | jq -r '.[]' | while read -r account; do
        if [[ -n "$account" ]]; then
            monitor_account "$account"
        fi
    done
}

# Main entry point
main() {
    init_config
    
    case "${1:-}" in
        --account)
            monitor_account "$2"
            ;;
        --all|"")
            monitor_all
            ;;
        --status)
            echo "Config: $CONFIG_FILE"
            echo "State: $STATE_FILE"
            echo "RPC: $(get_rpc)"
            echo "Accounts:"
            get_config '.accounts[]' 2>/dev/null || echo "  (none configured)"
            ;;
        *)
            echo "Usage: $0 [--account <account.near>] [--all] [--status]"
            exit 1
            ;;
    esac
}

main "$@"
