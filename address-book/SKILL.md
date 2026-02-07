# NEAR Address Book

Manage named addresses with nicknames, categories, and tags. Never copy-paste wallet addresses again.

## Commands

### near_address_add
Add a new address to your address book.

```
near_address_add <address> <nickname> [--category <cat>] [--tags <tag1,tag2>] [--notes <notes>]
```

**Examples:**
- `near_address_add alice.near "Alice" --category friends`
- `near_address_add 0x1234...abcd "CEX Hot Wallet" --category exchanges --tags binance,trading`
- `near_address_add bob.near "Bob from Work" --tags coworker,dev --notes "Met at NEARCON"`

### near_address_remove
Remove an address from your address book.

```
near_address_remove <address_or_nickname>
```

**Examples:**
- `near_address_remove alice.near`
- `near_address_remove "Alice"`

### near_address_lookup
Find an address by nickname or partial match.

```
near_address_lookup <query>
```

**Examples:**
- `near_address_lookup alice` → Returns all entries matching "alice"
- `near_address_lookup 0x1234` → Finds by partial address
- `near_address_lookup --category exchanges` → List all in category
- `near_address_lookup --tag defi` → List all with tag

### near_address_list
List all addresses, optionally filtered.

```
near_address_list [--category <cat>] [--tags <tag1,tag2>] [--format json|table]
```

**Examples:**
- `near_address_list` → Show all addresses
- `near_address_list --category friends`
- `near_address_list --format json` → Export-friendly output

### near_address_import
Import addresses from transaction history or file.

```
near_address_import --from-history <your_account> [--min-txs <n>]
near_address_import --from-file <path.json>
```

**Examples:**
- `near_address_import --from-history myaccount.near --min-txs 3` → Auto-suggest frequent contacts
- `near_address_import --from-file contacts-backup.json`

### near_address_export
Export address book to JSON.

```
near_address_export [--output <path>]
```

## Storage

Address book is stored in `data/address-book.json`:

```json
{
  "version": 1,
  "addresses": {
    "alice.near": {
      "nickname": "Alice",
      "category": "friends",
      "tags": ["nearcon", "dev"],
      "notes": "Met at NEARCON 2024",
      "addedAt": "2024-01-15T10:30:00Z",
      "lastUsed": "2024-02-01T14:22:00Z"
    }
  },
  "categories": ["friends", "exchanges", "contracts", "defi", "nft"],
  "recentLookups": []
}
```

## Default Categories

- **friends** - Personal contacts
- **exchanges** - CEX/DEX addresses
- **contracts** - Smart contracts
- **defi** - DeFi protocols
- **nft** - NFT marketplaces/collections
- **dao** - DAO treasuries
- **unknown** - Uncategorized

## Features

- **Fuzzy matching** - Lookup by partial nickname or address
- **Auto-suggest** - Import frequent contacts from transaction history
- **Reverse lookup** - See nickname when viewing transactions
- **Categories & tags** - Organize addresses your way
- **Export/Import** - Backup and share your address book
