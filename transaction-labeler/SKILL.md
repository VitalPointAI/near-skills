# NEAR Transaction Labeler

Auto-categorize and label NEAR transactions for accounting, analysis, and export.

## Commands

### near_tx_label
Label a single transaction.

```
near_tx_label <tx_hash> <label> [--notes <notes>]
```

**Examples:**
- `near_tx_label 7abc...def "Monthly rent payment"`
- `near_tx_label 8xyz...123 "NFT purchase" --notes "Bought NEARCON ticket"`

### near_tx_categorize
Auto-categorize transactions for an account.

```
near_tx_categorize <account> [--from <date>] [--to <date>] [--limit <n>]
```

**Examples:**
- `near_tx_categorize myaccount.near` → Categorize all transactions
- `near_tx_categorize myaccount.near --from 2024-01-01 --limit 100`

### near_tx_labels_export
Export labeled transactions.

```
near_tx_labels_export [--format csv|json] [--output <path>] [--category <cat>]
```

**Examples:**
- `near_tx_labels_export --format csv --output taxes-2024.csv`
- `near_tx_labels_export --category staking --format json`

### near_tx_bulk_label
Label multiple transactions at once.

```
near_tx_bulk_label --category <category> --hashes <hash1,hash2,...>
near_tx_bulk_label --category <category> --from-file <hashes.txt>
```

**Examples:**
- `near_tx_bulk_label --category staking --hashes abc123,def456,ghi789`

## Auto-Categorization Rules

The labeler automatically detects transaction types:

| Category | Detection Criteria |
|----------|-------------------|
| **transfer** | Simple NEAR transfers between accounts |
| **staking** | Interactions with *.poolv1.near, staking contracts |
| **defi** | Swaps on ref-finance.near, burrow, etc. |
| **nft** | Mints/transfers on paras.id, mintbase, etc. |
| **contract_deploy** | DeployContract actions |
| **contract_call** | FunctionCall to smart contracts |
| **account** | CreateAccount, DeleteAccount, AddKey |
| **bridge** | Rainbow bridge, wormhole interactions |
| **governance** | DAO proposals, voting |
| **unknown** | Unclassified transactions |

## Storage

Labels are stored in `data/tx-labels.json`:

```json
{
  "version": 1,
  "transactions": {
    "7abc123def456": {
      "hash": "7abc123def456",
      "category": "defi",
      "subcategory": "swap",
      "label": "ETH → NEAR swap",
      "notes": "Bought dip",
      "amount": "100.5",
      "token": "NEAR",
      "from": "myaccount.near",
      "to": "ref-finance.near",
      "timestamp": "2024-01-15T10:30:00Z",
      "labeledAt": "2024-01-16T08:00:00Z",
      "autoLabeled": false
    }
  },
  "categories": {
    "transfer": { "count": 45, "totalNear": "1234.5" },
    "staking": { "count": 12, "totalNear": "5000" }
  },
  "customLabels": ["rent", "salary", "equipment"]
}
```

## Export Formats

### CSV Export
```csv
hash,category,label,amount,token,from,to,timestamp,notes
7abc...,defi,ETH swap,100.5,NEAR,me.near,ref.near,2024-01-15,Bought dip
```

### JSON Export
```json
{
  "exportedAt": "2024-02-01T12:00:00Z",
  "account": "myaccount.near",
  "transactions": [...]
}
```

## Known Contracts

Auto-detected contract categories:

**DeFi:**
- ref-finance.near, v2.ref-finance.near (DEX)
- burrow.near (Lending)
- aurora.near (EVM)

**Staking:**
- *.poolv1.near (Validators)
- meta-pool.near (Liquid staking)

**NFT:**
- paras.id, x.paras.near
- mintbase1.near
- apollo42.near

**Bridges:**
- factory.bridge.near (Rainbow)
- core.wormhole.near

## Features

- **Smart detection** - Recognizes 50+ known contracts
- **Custom labels** - Add your own categories and labels
- **Bulk operations** - Label many transactions at once
- **Tax-ready exports** - CSV format for accounting software
- **Amount tracking** - Totals per category
- **Time filtering** - Export by date range
