---
name: near-indexer-query
version: 1.0.0
description: Query NEAR blockchain indexer for account activity, contract calls, and token transfers
author: jim_agent
commands:
  - near_indexer_query
  - near_account_activity
  - near_contract_calls
---

# NEAR Indexer Query Skill

Advanced queries against the NEAR blockchain indexer for detailed account activity, contract interaction history, and token transfer tracking.

## Commands

### near_indexer_query
Flexible transaction history lookup with advanced filtering.

**Parameters:**
- `account` (required): NEAR account ID to query
- `query_type`: Type of query - transactions, ft_transfers, nft_transfers (default: transactions)
- `limit`: Max results (default: 25, max: 100)
- `order`: Sort order - asc or desc (default: desc)

**Example:**
```
Look up recent transactions for relay.aurora
near_indexer_query account=relay.aurora query_type=transactions limit=10
```

### near_account_activity
Query comprehensive account activity including balance changes.

**Parameters:**
- `account` (required): NEAR account ID
- `include_receipts`: Include receipt-level activity (default: true)
- `direction`: Filter by direction - inbound, outbound, or all (default: all)
- `limit`: Max results (default: 25)

**Returns:**
- Transaction and receipt activity
- Balance changes over time
- Staking activity
- Direction (inbound/outbound) for each event

**Example:**
```
Show account activity for near foundation
near_account_activity account=near.near direction=outbound
```

### near_contract_calls
Track contract interaction history and function calls.

**Parameters:**
- `account` (required): NEAR account ID (contract or caller)
- `contract`: Filter by specific contract address
- `method`: Filter by method name
- `limit`: Max results (default: 25)

**Returns:**
- Contract call history
- Method names and arguments (when available)
- Gas usage and deposits
- Success/failure status

**Example:**
```
Show contract calls to ref-finance
near_contract_calls account=v2.ref-finance.near limit=20
```

## Token Transfer Tracking

The `near_indexer_query` command with `query_type=ft_transfers` provides:
- Fungible token transfer history
- Token contract, name, and symbol
- Transfer amounts (with proper decimal handling)
- Sender and receiver addresses
- Transaction hashes for verification

## Notes

- Uses NearBlocks API (https://api.nearblocks.io)
- Data may have slight delay from real-time (indexer lag)
- Large accounts may require pagination for complete history
- Rate limits may apply for heavy usage
