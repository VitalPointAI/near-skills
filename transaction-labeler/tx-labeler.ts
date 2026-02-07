#!/usr/bin/env npx ts-node
/**
 * NEAR Transaction Labeler - Auto-categorize and label transactions
 * 
 * Usage:
 *   npx ts-node tx-labeler.ts label <tx_hash> <label> [--notes <notes>]
 *   npx ts-node tx-labeler.ts categorize <account> [options]
 *   npx ts-node tx-labeler.ts bulk-label --category <cat> --hashes <h1,h2>
 *   npx ts-node tx-labeler.ts export [options]
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_FILE = path.join(__dirname, 'data', 'tx-labels.json');

interface TransactionLabel {
  hash: string;
  category: string;
  subcategory?: string;
  label?: string;
  notes?: string;
  amount?: string;
  token?: string;
  from?: string;
  to?: string;
  timestamp?: string;
  autoLabeled: boolean;
  labeledAt: string;
}

interface CategoryStats {
  count: number;
  totalNear: string;
}

interface LabelsDatabase {
  version: number;
  transactions: Record<string, TransactionLabel>;
  categories: Record<string, CategoryStats>;
  customLabels: string[];
}

interface ParsedArgs {
  _: string[];
  [key: string]: string | boolean | string[];
}

// Known contract patterns for auto-categorization
const CONTRACT_PATTERNS: Record<string, RegExp[]> = {
  staking: [
    /\.poolv1\.near$/,
    /^meta-pool\.near$/,
    /^astro-stakers\.near$/,
    /^linear-protocol\.near$/
  ],
  defi: [
    /^ref-finance\.near$/,
    /^v2\.ref-finance\.near$/,
    /^burrow\.near$/,
    /^aurora$/,
    /^priceoracle\.near$/,
    /^wrap\.near$/,
    /^usn$/,
    /^token\.sweat$/
  ],
  nft: [
    /^paras\.id$/,
    /\.paras\.near$/,
    /^mintbase\d*\.near$/,
    /^apollo42\.near$/,
    /^nft\.nearapps\.near$/,
    /^few-and-far\.near$/
  ],
  bridge: [
    /^factory\.bridge\.near$/,
    /^aurora$/,
    /^core\.wormhole\.near$/,
    /^prover\.bridge\.near$/
  ],
  governance: [
    /^sputnik-dao\.near$/,
    /\.sputnikdao\.near$/,
    /^astro-dao\.near$/,
    /^voting\./
  ]
};

// Ensure data directory exists
function ensureDataDir(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Load labels database
function loadLabels(): LabelsDatabase {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {
      version: 1,
      transactions: {},
      categories: {},
      customLabels: []
    };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

// Save labels database
function saveLabels(data: LabelsDatabase): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Parse command line arguments
function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = { _: [] };
  let i = 0;
  while (i < args.length) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        result[key] = args[i + 1];
        i += 2;
      } else {
        result[key] = true;
        i++;
      }
    } else {
      result._.push(args[i]);
      i++;
    }
  }
  return result;
}

interface Action {
  kind?: string;
  method_name?: string;
  args?: unknown;
}

// Detect category based on receiver
function detectCategory(receiver: string, actions?: Action[]): string {
  // Check for contract deployment
  if (actions?.some(a => a.kind === 'DeployContract')) {
    return 'contract_deploy';
  }
  
  // Check for account operations
  if (actions?.some(a => ['CreateAccount', 'DeleteAccount', 'AddKey', 'DeleteKey'].includes(a.kind || ''))) {
    return 'account';
  }
  
  // Check known contract patterns
  for (const [category, patterns] of Object.entries(CONTRACT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(receiver)) {
        return category;
      }
    }
  }
  
  // Simple transfer (no function call)
  if (!actions || actions.every(a => a.kind === 'Transfer')) {
    return 'transfer';
  }
  
  // Function call to unknown contract
  if (actions?.some(a => a.kind === 'FunctionCall')) {
    return 'contract_call';
  }
  
  return 'unknown';
}

// Detect subcategory for DeFi transactions
function detectSubcategory(methodName?: string): string | null {
  if (!methodName) return null;
  
  const method = methodName.toLowerCase();
  
  if (method.includes('swap')) return 'swap';
  if (method.includes('stake') || method.includes('unstake')) return 'staking';
  if (method.includes('deposit')) return 'deposit';
  if (method.includes('withdraw')) return 'withdraw';
  if (method.includes('borrow')) return 'borrow';
  if (method.includes('repay')) return 'repay';
  if (method.includes('mint')) return 'mint';
  if (method.includes('burn')) return 'burn';
  if (method.includes('transfer')) return 'transfer';
  if (method.includes('vote')) return 'vote';
  if (method.includes('propose')) return 'proposal';
  
  return null;
}

// Label a single transaction
function labelTransaction(txHash: string, label: string, options: ParsedArgs): void {
  const db = loadLabels();
  
  const entry: TransactionLabel = db.transactions[txHash] || {
    hash: txHash,
    category: (options.category as string) || 'unknown',
    labeledAt: new Date().toISOString(),
    autoLabeled: false
  };
  
  entry.label = label;
  entry.notes = (options.notes as string) || entry.notes || '';
  entry.autoLabeled = false;
  entry.labeledAt = new Date().toISOString();
  
  if (options.category) {
    entry.category = options.category as string;
  }
  
  db.transactions[txHash] = entry;
  
  // Update category counts
  if (!db.categories[entry.category]) {
    db.categories[entry.category] = { count: 0, totalNear: '0' };
  }
  
  // Add to custom labels if new
  if (label && !db.customLabels.includes(label)) {
    db.customLabels.push(label);
  }
  
  saveLabels(db);
  
  console.log(`✅ Labeled transaction: ${txHash.slice(0, 12)}...`);
  console.log(`   Label: ${label}`);
  console.log(`   Category: ${entry.category}`);
  if (entry.notes) console.log(`   Notes: ${entry.notes}`);
}

// Auto-categorize transactions (mock)
function categorizeTransactions(account: string, _options: ParsedArgs): void {
  console.log(`🔍 Analyzing transactions for ${account}...`);
  console.log('');
  console.log('💡 To implement full categorization, integrate with NEAR RPC:');
  console.log('   - Fetch transactions via nearblocks.io API or NEAR RPC');
  console.log('   - Parse actions and receiver accounts');
  console.log('   - Apply detection rules');
  console.log('');
  console.log('Sample categorization output:');
  console.log('');
  console.log('  📊 Category Summary:');
  console.log('  ─────────────────────');
  console.log('  Transfer:     23 txs (456.7 NEAR)');
  console.log('  Staking:      12 txs (1,000 NEAR)');
  console.log('  DeFi:         45 txs (234.5 NEAR)');
  console.log('  NFT:           8 txs (12.3 NEAR)');
  console.log('  Contract:     15 txs (0.5 NEAR)');
  console.log('');
  console.log('Use near_tx_label to add custom labels to specific transactions.');
}

// Bulk label transactions
function bulkLabel(category: string, hashes: string, options: ParsedArgs): void {
  const db = loadLabels();
  const hashList = hashes.split(',').map(h => h.trim());
  
  let count = 0;
  for (const hash of hashList) {
    if (!hash) continue;
    
    db.transactions[hash] = {
      hash,
      category,
      label: (options.label as string) || '',
      notes: (options.notes as string) || '',
      autoLabeled: false,
      labeledAt: new Date().toISOString()
    };
    count++;
  }
  
  // Update category count
  if (!db.categories[category]) {
    db.categories[category] = { count: 0, totalNear: '0' };
  }
  db.categories[category].count += count;
  
  saveLabels(db);
  console.log(`✅ Bulk labeled ${count} transactions as "${category}"`);
}

// Export labeled transactions
function exportLabels(options: ParsedArgs): void {
  const db = loadLabels();
  const format = (options.format as string) || 'json';
  const outputPath = (options.output as string) || `tx-export-${Date.now()}.${format}`;
  
  let entries = Object.values(db.transactions);
  
  // Filter by category
  if (options.category) {
    entries = entries.filter(tx => tx.category === options.category);
  }
  
  // Filter by date range
  if (options.from) {
    const fromDate = new Date(options.from as string);
    entries = entries.filter(tx => new Date(tx.timestamp || tx.labeledAt) >= fromDate);
  }
  if (options.to) {
    const toDate = new Date(options.to as string);
    entries = entries.filter(tx => new Date(tx.timestamp || tx.labeledAt) <= toDate);
  }
  
  if (entries.length === 0) {
    console.log('📭 No transactions to export');
    return;
  }
  
  if (format === 'csv') {
    const headers = ['hash', 'category', 'subcategory', 'label', 'amount', 'token', 'from', 'to', 'timestamp', 'notes'];
    const rows = [headers.join(',')];
    
    for (const tx of entries) {
      const row = headers.map(h => {
        const val = (tx as unknown as Record<string, unknown>)[h] || '';
        const strVal = String(val);
        // Escape CSV values
        if (strVal.includes(',') || strVal.includes('"')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      });
      rows.push(row.join(','));
    }
    
    fs.writeFileSync(outputPath, rows.join('\n'));
  } else {
    const exportData = {
      exportedAt: new Date().toISOString(),
      count: entries.length,
      transactions: entries,
      categories: db.categories
    };
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  }
  
  console.log(`✅ Exported ${entries.length} transactions to ${outputPath}`);
  
  // Show summary
  console.log('\n📊 Export Summary:');
  const byCat: Record<string, number> = {};
  for (const tx of entries) {
    byCat[tx.category] = (byCat[tx.category] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(byCat)) {
    console.log(`   ${cat}: ${count}`);
  }
}

// Show statistics
function showStats(): void {
  const db = loadLabels();
  const total = Object.keys(db.transactions).length;
  
  console.log('📊 Transaction Labels Statistics');
  console.log('─'.repeat(40));
  console.log(`Total labeled: ${total}`);
  console.log('');
  console.log('By Category:');
  
  for (const [cat, data] of Object.entries(db.categories)) {
    if (data.count > 0) {
      console.log(`  ${cat}: ${data.count} (${data.totalNear} NEAR)`);
    }
  }
  
  if (db.customLabels.length > 0) {
    console.log('');
    console.log(`Custom Labels: ${db.customLabels.slice(0, 10).join(', ')}${db.customLabels.length > 10 ? '...' : ''}`);
  }
}

// Main
function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  
  switch (command) {
    case 'label':
      if (args._.length < 3) {
        console.log('Usage: near_tx_label <tx_hash> <label> [--notes <notes>] [--category <cat>]');
        process.exit(1);
      }
      labelTransaction(args._[1], args._[2], args);
      break;
      
    case 'categorize':
      if (args._.length < 2) {
        console.log('Usage: near_tx_categorize <account> [--from <date>] [--to <date>] [--limit <n>]');
        process.exit(1);
      }
      categorizeTransactions(args._[1], args);
      break;
      
    case 'bulk-label':
      if (!args.category || !args.hashes) {
        console.log('Usage: near_tx_bulk_label --category <category> --hashes <h1,h2,h3>');
        process.exit(1);
      }
      bulkLabel(args.category as string, args.hashes as string, args);
      break;
      
    case 'export':
      exportLabels(args);
      break;
      
    case 'stats':
      showStats();
      break;
      
    default:
      console.log(`
NEAR Transaction Labeler - Auto-categorize and label transactions

Commands:
  label <hash> <label>     Label a single transaction
  categorize <account>     Auto-categorize account transactions
  bulk-label               Label multiple transactions
  export                   Export labeled transactions
  stats                    Show labeling statistics

Examples:
  npx ts-node tx-labeler.ts label 7abc...def "Monthly rent"
  npx ts-node tx-labeler.ts categorize myaccount.near
  npx ts-node tx-labeler.ts bulk-label --category staking --hashes abc,def,ghi
  npx ts-node tx-labeler.ts export --format csv --output taxes.csv

Categories: transfer, staking, defi, nft, contract_deploy, contract_call, 
            account, bridge, governance, unknown
      `);
  }
}

main();
