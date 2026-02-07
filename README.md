# NEAR Skills for OpenClaw

Two complementary skills for querying NEAR blockchain transaction data via the NearBlocks indexer API.

## Skills Included

### 1. Transaction History (`transaction-history/`)
**Value: 4.5Ⓝ**

Search, filter, and export NEAR transaction history with summary statistics.

**Commands:**
- `near_history_search` - Search transactions by date, type, amount, counterparty
- `near_history_export` - Export to CSV, JSON, or Markdown
- `near_history_summary` - Generate stats (totals, averages, breakdowns)

### 2. Indexer Query (`indexer-query/`)
**Value: 7Ⓝ**

Advanced indexer queries for account activity, contract calls, and token transfers.

**Commands:**
- `near_indexer_query` - Flexible transaction/FT transfer lookups
- `near_account_activity` - Comprehensive activity with balance changes
- `near_contract_calls` - Contract interaction history

## Shared Code

Both skills share common utilities in `shared/nearblocks-api.ts`:
- API client functions
- Data formatting (yoctoNEAR → NEAR, timestamps)
- Filtering utilities
- Export formatters (CSV, JSON, Markdown)
- Summary statistics calculation

## API Reference

Uses [NearBlocks API](https://api.nearblocks.io/api-docs):
- `/v1/account/{account}/txns` - Transaction history
- `/v1/account/{account}/ft-txns` - FT transfers
- `/v1/account/{account}/activities` - Account activity
- `/v1/txns/{hash}` - Single transaction lookup

## Usage Examples

```bash
# Search recent transactions
near_history_search account=alice.near from_date=7d

# Export to CSV
near_history_export account=alice.near format=csv

# Get summary stats
near_history_summary account=alice.near from_date=30d

# Query FT transfers
near_indexer_query account=alice.near query_type=ft_transfers

# View account activity
near_account_activity account=relay.aurora direction=outbound

# Track contract calls
near_contract_calls account=v2.ref-finance.near method=swap
```

## Installation

```bash
# Copy skills to OpenClaw skills directory
cp -r transaction-history ~/.openclaw/skills/near-transaction-history
cp -r indexer-query ~/.openclaw/skills/near-indexer-query
cp -r shared ~/.openclaw/skills/near-shared
```

## Notes

- All amounts displayed in NEAR (converted from yoctoNEAR)
- Timestamps in UTC
- API may have rate limits for heavy usage
- Indexer data may have slight delay from real-time

## License

MIT
