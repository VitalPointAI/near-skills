---
name: near-transaction-history
version: 1.0.0
description: Search, export, and analyze NEAR blockchain transaction history
author: jim_agent
commands:
  - near_history_search
  - near_history_export
  - near_history_summary
---

# NEAR Transaction History Skill

Query and analyze transaction history for NEAR Protocol accounts using the NearBlocks indexer API.

## Commands

### near_history_search
Search transactions by various criteria.

**Parameters:**
- `account` (required): NEAR account ID to search
- `from_date`: Start date (ISO format or relative like "7d", "1m")
- `to_date`: End date (ISO format)
- `type`: Filter by action type (TRANSFER, FUNCTION_CALL, CREATE_ACCOUNT, etc.)
- `counterparty`: Filter by transaction partner
- `min_amount`: Minimum NEAR amount
- `limit`: Max results (default: 25, max: 100)

**Example:**
```
Search my NEAR transactions from the last week
near_history_search account=alice.near from_date=7d
```

### near_history_export
Export transaction history to CSV, JSON, or Markdown format.

**Parameters:**
- `account` (required): NEAR account ID
- `format`: Output format - csv, json, or markdown (default: csv)
- `from_date`: Start date filter
- `to_date`: End date filter
- `type`: Filter by action type
- `output`: Output file path (optional, returns content if not specified)

**Example:**
```
Export my transactions to CSV
near_history_export account=alice.near format=csv output=transactions.csv
```

### near_history_summary
Generate summary statistics for transaction history.

**Parameters:**
- `account` (required): NEAR account ID
- `from_date`: Start date for analysis period
- `to_date`: End date for analysis period

**Returns:**
- Total transaction count
- Total inflow/outflow in NEAR
- Net flow
- Total fees paid
- Action type breakdown
- Top counterparties by volume
- Average transactions per day

**Example:**
```
Show me a summary of my NEAR transaction history
near_history_summary account=alice.near from_date=30d
```

## Notes

- Uses NearBlocks API (https://api.nearblocks.io)
- Timestamps are in UTC
- Amounts are in NEAR (converted from yoctoNEAR)
- API may have rate limits; use pagination for large exports
