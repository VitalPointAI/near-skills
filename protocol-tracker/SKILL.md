# NEAR Protocol Tracker

Track NEAR protocol versions, upgrades, and NEP proposals.

## Commands

### near_protocol_version
Get current protocol version from mainnet and/or testnet.

```bash
# Both networks (default)
./scripts/protocol-version.sh

# Specific network
./scripts/protocol-version.sh mainnet
./scripts/protocol-version.sh testnet
```

### near_protocol_upgrades
Monitor nearcore GitHub releases for upgrade history.

```bash
# Latest 10 releases (default)
./scripts/protocol-upgrades.sh

# Custom count
./scripts/protocol-upgrades.sh 20
```

### near_nep_status
Track NEP (NEAR Enhancement Proposal) status from the NEPs repo.

```bash
# List all NEPs with status
./scripts/nep-status.sh

# Filter by status
./scripts/nep-status.sh final
./scripts/nep-status.sh draft
./scripts/nep-status.sh review
```

## Data Sources

- **Protocol Version**: NEAR RPC endpoints
  - Mainnet: https://rpc.mainnet.near.org
  - Testnet: https://rpc.testnet.near.org
- **Releases**: https://github.com/near/nearcore/releases
- **NEPs**: https://github.com/near/NEPs

## Output Format

All scripts output JSON for easy parsing. Use `jq` for filtering.

## Examples

```bash
# Quick protocol check
./scripts/protocol-version.sh | jq '.mainnet.protocol_version'

# Find latest stable release
./scripts/protocol-upgrades.sh | jq '.[0]'

# Count final NEPs
./scripts/nep-status.sh final | jq 'length'
```
