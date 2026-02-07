#!/bin/bash
# Get NEAR protocol version from RPC endpoints
# Usage: ./protocol-version.sh [mainnet|testnet|both]

set -e

MAINNET_RPC="https://rpc.mainnet.near.org"
TESTNET_RPC="https://rpc.testnet.near.org"

get_status() {
    local rpc_url="$1"
    curl -s -X POST "$rpc_url" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":"1","method":"status","params":[]}' \
    | jq '{
        chain_id: .result.chain_id,
        protocol_version: .result.protocol_version,
        latest_protocol_version: .result.latest_protocol_version,
        node_version: .result.version.version,
        build: .result.version.build,
        latest_block_height: .result.sync_info.latest_block_height,
        latest_block_time: .result.sync_info.latest_block_time,
        syncing: .result.sync_info.syncing
    }'
}

NETWORK="${1:-both}"

case "$NETWORK" in
    mainnet)
        echo '{"mainnet":' 
        get_status "$MAINNET_RPC"
        echo '}'
        ;;
    testnet)
        echo '{"testnet":'
        get_status "$TESTNET_RPC"
        echo '}'
        ;;
    both|*)
        # Fetch both in parallel
        MAINNET_RESULT=$(get_status "$MAINNET_RPC")
        TESTNET_RESULT=$(get_status "$TESTNET_RPC")
        jq -n \
            --argjson mainnet "$MAINNET_RESULT" \
            --argjson testnet "$TESTNET_RESULT" \
            '{mainnet: $mainnet, testnet: $testnet}'
        ;;
esac
