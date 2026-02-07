#!/usr/bin/env npx ts-node
"use strict";
/**
 * NEAR Address Book - Manage named addresses with nicknames, categories, and tags
 *
 * Usage:
 *   npx ts-node address-book.ts add <address> <nickname> [options]
 *   npx ts-node address-book.ts remove <address_or_nickname>
 *   npx ts-node address-book.ts lookup <query> [options]
 *   npx ts-node address-book.ts list [options]
 *   npx ts-node address-book.ts import [options]
 *   npx ts-node address-book.ts export [options]
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_FILE = path.join(__dirname, 'data', 'address-book.json');
// Ensure data directory exists
function ensureDataDir() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
// Load address book
function loadAddressBook() {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
        return {
            version: 1,
            addresses: {},
            categories: ['friends', 'exchanges', 'contracts', 'defi', 'nft', 'dao', 'unknown'],
            recentLookups: []
        };
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
// Save address book
function saveAddressBook(data) {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
// Parse command line arguments
function parseArgs(args) {
    const result = { _: [] };
    let i = 0;
    while (i < args.length) {
        if (args[i].startsWith('--')) {
            const key = args[i].slice(2);
            if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
                result[key] = args[i + 1];
                i += 2;
            }
            else {
                result[key] = true;
                i++;
            }
        }
        else {
            result._.push(args[i]);
            i++;
        }
    }
    return result;
}
// Add address
function addAddress(address, nickname, options) {
    const book = loadAddressBook();
    const tagsStr = options.tags;
    const entry = {
        nickname,
        category: options.category || 'unknown',
        tags: tagsStr ? tagsStr.split(',').map(t => t.trim()) : [],
        notes: options.notes || '',
        addedAt: new Date().toISOString(),
        lastUsed: null
    };
    // Add category if new
    if (entry.category && !book.categories.includes(entry.category)) {
        book.categories.push(entry.category);
    }
    book.addresses[address] = entry;
    saveAddressBook(book);
    console.log(`✅ Added: ${nickname} (${address})`);
    if (entry.category !== 'unknown')
        console.log(`   Category: ${entry.category}`);
    if (entry.tags.length > 0)
        console.log(`   Tags: ${entry.tags.join(', ')}`);
    if (entry.notes)
        console.log(`   Notes: ${entry.notes}`);
}
// Remove address
function removeAddress(query) {
    const book = loadAddressBook();
    // Try exact address match first
    if (book.addresses[query]) {
        const nickname = book.addresses[query].nickname;
        delete book.addresses[query];
        saveAddressBook(book);
        console.log(`✅ Removed: ${nickname} (${query})`);
        return;
    }
    // Try nickname match
    const queryLower = query.toLowerCase();
    for (const [addr, entry] of Object.entries(book.addresses)) {
        if (entry.nickname.toLowerCase() === queryLower) {
            delete book.addresses[addr];
            saveAddressBook(book);
            console.log(`✅ Removed: ${entry.nickname} (${addr})`);
            return;
        }
    }
    console.log(`❌ Not found: ${query}`);
}
// Lookup address
function lookupAddress(query, options) {
    const book = loadAddressBook();
    const results = [];
    const queryLower = query ? query.toLowerCase() : '';
    for (const [addr, entry] of Object.entries(book.addresses)) {
        let match = false;
        // Filter by category
        if (options.category) {
            if (entry.category !== options.category)
                continue;
            match = true;
        }
        // Filter by tag
        if (options.tag) {
            if (!entry.tags.includes(options.tag))
                continue;
            match = true;
        }
        // Text search
        if (query && !options.category && !options.tag) {
            if (addr.toLowerCase().includes(queryLower) ||
                entry.nickname.toLowerCase().includes(queryLower) ||
                (entry.notes && entry.notes.toLowerCase().includes(queryLower))) {
                match = true;
            }
        }
        if (match || (!query && !options.category && !options.tag)) {
            results.push({ address: addr, ...entry });
        }
    }
    if (results.length === 0) {
        console.log(`🔍 No results found for: ${query || 'given filters'}`);
        return;
    }
    // Update recent lookups
    if (query) {
        book.recentLookups = [query, ...book.recentLookups.filter(l => l !== query)].slice(0, 10);
        saveAddressBook(book);
    }
    console.log(`🔍 Found ${results.length} result(s):\n`);
    for (const r of results) {
        console.log(`📇 ${r.nickname}`);
        console.log(`   Address: ${r.address}`);
        if (r.category !== 'unknown')
            console.log(`   Category: ${r.category}`);
        if (r.tags.length > 0)
            console.log(`   Tags: ${r.tags.join(', ')}`);
        if (r.notes)
            console.log(`   Notes: ${r.notes}`);
        console.log('');
    }
}
// List all addresses
function listAddresses(options) {
    const book = loadAddressBook();
    let entries = Object.entries(book.addresses);
    // Filter by category
    if (options.category) {
        entries = entries.filter(([_, e]) => e.category === options.category);
    }
    // Filter by tags
    if (options.tags) {
        const filterTags = options.tags.split(',').map(t => t.trim());
        entries = entries.filter(([_, e]) => filterTags.some(tag => e.tags.includes(tag)));
    }
    if (entries.length === 0) {
        console.log('📒 Address book is empty');
        return;
    }
    // JSON format
    if (options.format === 'json') {
        const output = {};
        for (const [addr, entry] of entries) {
            output[addr] = entry;
        }
        console.log(JSON.stringify(output, null, 2));
        return;
    }
    // Table format (default)
    console.log(`📒 Address Book (${entries.length} entries)\n`);
    console.log('─'.repeat(80));
    // Group by category
    const byCategory = {};
    for (const [addr, entry] of entries) {
        const cat = entry.category || 'unknown';
        if (!byCategory[cat])
            byCategory[cat] = [];
        byCategory[cat].push({ address: addr, ...entry });
    }
    for (const [category, items] of Object.entries(byCategory)) {
        console.log(`\n📁 ${category.toUpperCase()}`);
        for (const item of items) {
            const tags = item.tags.length > 0 ? ` [${item.tags.join(', ')}]` : '';
            console.log(`   ${item.nickname}: ${item.address}${tags}`);
        }
    }
    console.log('\n' + '─'.repeat(80));
    console.log(`Categories: ${book.categories.join(', ')}`);
}
// Import from file
function importFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        return;
    }
    const imported = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const book = loadAddressBook();
    let count = 0;
    const addressData = imported.addresses || imported;
    for (const [addr, entry] of Object.entries(addressData)) {
        if (!book.addresses[addr]) {
            book.addresses[addr] = {
                nickname: entry.nickname || addr.slice(0, 12),
                category: entry.category || 'unknown',
                tags: entry.tags || [],
                notes: entry.notes || '',
                addedAt: entry.addedAt || new Date().toISOString(),
                lastUsed: entry.lastUsed || null
            };
            count++;
        }
    }
    saveAddressBook(book);
    console.log(`✅ Imported ${count} new addresses`);
}
// Import from transaction history (mock)
function importFromHistory(account, minTxs = 2) {
    console.log(`🔍 Analyzing transaction history for ${account}...`);
    console.log(`   Looking for addresses with at least ${minTxs} transactions`);
    console.log('');
    console.log('💡 To implement this, integrate with NEAR RPC to fetch transaction history.');
    console.log('   Suggested frequent contacts will appear here.');
    console.log('');
    console.log('Example output:');
    console.log('   📥 5 txs: wrap.near (NEAR wrapping)');
    console.log('   📥 3 txs: ref-finance.near (DEX)');
    console.log('');
    console.log('Use: near_address_add <address> <nickname> --category <cat>');
}
// Export address book
function exportAddressBook(outputPath) {
    const book = loadAddressBook();
    const output = outputPath || 'address-book-export.json';
    fs.writeFileSync(output, JSON.stringify(book, null, 2));
    console.log(`✅ Exported ${Object.keys(book.addresses).length} addresses to ${output}`);
}
// Main
function main() {
    const args = parseArgs(process.argv.slice(2));
    const command = args._[0];
    switch (command) {
        case 'add':
            if (args._.length < 3) {
                console.log('Usage: near_address_add <address> <nickname> [--category <cat>] [--tags <tags>] [--notes <notes>]');
                process.exit(1);
            }
            addAddress(args._[1], args._[2], args);
            break;
        case 'remove':
            if (args._.length < 2) {
                console.log('Usage: near_address_remove <address_or_nickname>');
                process.exit(1);
            }
            removeAddress(args._[1]);
            break;
        case 'lookup':
            lookupAddress(args._[1], args);
            break;
        case 'list':
            listAddresses(args);
            break;
        case 'import':
            if (args['from-file']) {
                importFromFile(args['from-file']);
            }
            else if (args['from-history']) {
                importFromHistory(args['from-history'], parseInt(args['min-txs']) || 2);
            }
            else {
                console.log('Usage: near_address_import --from-file <path> OR --from-history <account>');
            }
            break;
        case 'export':
            exportAddressBook(args.output);
            break;
        default:
            console.log(`
NEAR Address Book - Manage named addresses

Commands:
  add <address> <nickname>   Add a new address
  remove <address|nickname>  Remove an address
  lookup <query>             Search addresses
  list                       List all addresses
  import                     Import from file or history
  export                     Export to JSON

Examples:
  npx ts-node address-book.ts add alice.near "Alice" --category friends
  npx ts-node address-book.ts lookup alice
  npx ts-node address-book.ts list --category defi
  npx ts-node address-book.ts export --output backup.json
      `);
    }
}
main();
//# sourceMappingURL=address-book.js.map