"use strict";
/**
 * NEAR Transaction History Skill
 * Commands: near_history_search, near_history_export, near_history_summary
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
exports.near_history_search = near_history_search;
exports.near_history_export = near_history_export;
exports.near_history_summary = near_history_summary;
const nearblocks_api_1 = require("../shared/nearblocks-api");
/**
 * Parse relative date string (7d, 1m, etc.) to Date
 */
function parseRelativeDate(dateStr) {
    if (!dateStr)
        return undefined;
    // Check if it's a relative date
    const match = dateStr.match(/^(\d+)([dhm])$/i);
    if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        const now = new Date();
        switch (unit) {
            case 'd': return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
            case 'h': return new Date(now.getTime() - value * 60 * 60 * 1000);
            case 'm': return new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000);
        }
    }
    // Try parsing as ISO date
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? undefined : parsed;
}
/**
 * Fetch all transactions with pagination
 */
async function fetchAllTransactions(accountId, limit = 100) {
    const allTxns = [];
    let page = 1;
    const perPage = Math.min(limit, 25);
    while (allTxns.length < limit) {
        const response = await (0, nearblocks_api_1.getAccountTransactions)(accountId, {
            page,
            per_page: perPage,
        });
        if (!response.txns || response.txns.length === 0)
            break;
        allTxns.push(...response.txns);
        if (response.txns.length < perPage)
            break;
        page++;
    }
    return allTxns.slice(0, limit);
}
/**
 * near_history_search - Search transactions by criteria
 */
async function near_history_search(params) {
    const { account, from_date, to_date, type, counterparty, min_amount, limit = 25 } = params;
    if (!account) {
        return '❌ Error: account parameter is required';
    }
    try {
        // Fetch transactions
        let transactions = await fetchAllTransactions(account, Math.min(limit, 100));
        // Apply filters
        const startDate = parseRelativeDate(from_date || '');
        const endDate = parseRelativeDate(to_date || '');
        if (startDate || endDate) {
            transactions = (0, nearblocks_api_1.filterByDateRange)(transactions, startDate, endDate);
        }
        if (type) {
            transactions = (0, nearblocks_api_1.filterByActionType)(transactions, type.split(','));
        }
        if (counterparty) {
            transactions = (0, nearblocks_api_1.filterByCounterparty)(transactions, counterparty, account);
        }
        if (min_amount !== undefined) {
            transactions = (0, nearblocks_api_1.filterByMinAmount)(transactions, min_amount);
        }
        if (transactions.length === 0) {
            return `📭 No transactions found for **${account}** matching your criteria.`;
        }
        // Format results
        let result = `## 📊 Transaction History for ${account}\n\n`;
        result += `Found **${transactions.length}** transactions`;
        if (startDate)
            result += ` since ${startDate.toISOString().split('T')[0]}`;
        result += '\n\n';
        for (const tx of transactions.slice(0, 25)) {
            const date = (0, nearblocks_api_1.formatTimestamp)(tx.block_timestamp).split('T')[0];
            const time = (0, nearblocks_api_1.formatTimestamp)(tx.block_timestamp).split('T')[1].slice(0, 5);
            const action = tx.actions?.[0]?.action || 'Unknown';
            const amount = (0, nearblocks_api_1.formatNear)(tx.actions_agg?.deposit || 0);
            const status = tx.outcomes?.status ? '✅' : '❌';
            const direction = tx.signer_account_id === account ? '→' : '←';
            const other = tx.signer_account_id === account
                ? tx.receiver_account_id
                : tx.signer_account_id;
            result += `${status} **${date}** ${time} | ${action} | ${direction} ${other}`;
            if (parseFloat(amount) > 0) {
                result += ` | ${amount} Ⓝ`;
            }
            result += '\n';
            result += `   └ \`${tx.transaction_hash.slice(0, 12)}...\`\n`;
        }
        if (transactions.length > 25) {
            result += `\n_...and ${transactions.length - 25} more. Use **near_history_export** for full data._`;
        }
        return result;
    }
    catch (error) {
        return `❌ Error fetching transactions: ${error instanceof Error ? error.message : String(error)}`;
    }
}
/**
 * near_history_export - Export transactions to various formats
 */
async function near_history_export(params) {
    const { account, format = 'csv', from_date, to_date, type, output } = params;
    if (!account) {
        return '❌ Error: account parameter is required';
    }
    try {
        // Fetch more transactions for export
        let transactions = await fetchAllTransactions(account, 200);
        // Apply filters
        const startDate = parseRelativeDate(from_date || '');
        const endDate = parseRelativeDate(to_date || '');
        if (startDate || endDate) {
            transactions = (0, nearblocks_api_1.filterByDateRange)(transactions, startDate, endDate);
        }
        if (type) {
            transactions = (0, nearblocks_api_1.filterByActionType)(transactions, type.split(','));
        }
        if (transactions.length === 0) {
            return `📭 No transactions found for **${account}** to export.`;
        }
        // Generate export
        let content;
        let extension;
        switch (format.toLowerCase()) {
            case 'json':
                content = (0, nearblocks_api_1.exportToJSON)(transactions);
                extension = 'json';
                break;
            case 'markdown':
            case 'md':
                content = (0, nearblocks_api_1.exportToMarkdown)(transactions);
                extension = 'md';
                break;
            case 'csv':
            default:
                content = (0, nearblocks_api_1.exportToCSV)(transactions);
                extension = 'csv';
                break;
        }
        // If output path specified, save to file
        if (output) {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await fs.writeFile(output, content);
            return `✅ Exported **${transactions.length}** transactions to \`${output}\``;
        }
        // Otherwise return content
        let result = `## 📤 Export: ${transactions.length} transactions (${format.toUpperCase()})\n\n`;
        if (format === 'json' && content.length > 3000) {
            result += '```json\n' + content.slice(0, 3000) + '\n...(truncated)\n```';
        }
        else if (format === 'csv' && content.length > 2000) {
            result += '```csv\n' + content.slice(0, 2000) + '\n...(truncated)\n```';
        }
        else if (format === 'markdown') {
            result += content;
        }
        else {
            result += '```' + extension + '\n' + content + '\n```';
        }
        return result;
    }
    catch (error) {
        return `❌ Error exporting transactions: ${error instanceof Error ? error.message : String(error)}`;
    }
}
/**
 * near_history_summary - Generate summary statistics
 */
async function near_history_summary(params) {
    const { account, from_date, to_date } = params;
    if (!account) {
        return '❌ Error: account parameter is required';
    }
    try {
        // Fetch transactions
        let transactions = await fetchAllTransactions(account, 200);
        // Apply date filters
        const startDate = parseRelativeDate(from_date || '');
        const endDate = parseRelativeDate(to_date || '');
        if (startDate || endDate) {
            transactions = (0, nearblocks_api_1.filterByDateRange)(transactions, startDate, endDate);
        }
        if (transactions.length === 0) {
            return `📭 No transactions found for **${account}** in the specified period.`;
        }
        // Calculate summary
        const summary = (0, nearblocks_api_1.calculateSummary)(transactions, account);
        // Format output
        let result = `## 📈 Transaction Summary for ${account}\n\n`;
        if (startDate) {
            result += `📅 Period: ${startDate.toISOString().split('T')[0]} to ${endDate?.toISOString().split('T')[0] || 'now'}\n\n`;
        }
        result += `### Overview\n`;
        result += `- **Total Transactions:** ${summary.total_transactions}\n`;
        result += `- **Avg/Day:** ${summary.avg_tx_per_day}\n\n`;
        result += `### 💰 Flow\n`;
        result += `- **Inflow:** +${summary.total_inflow_near} Ⓝ\n`;
        result += `- **Outflow:** -${summary.total_outflow_near} Ⓝ\n`;
        result += `- **Net:** ${summary.net_flow_near} Ⓝ\n`;
        result += `- **Fees Paid:** ${summary.total_fees_near} Ⓝ\n\n`;
        result += `### 📊 Action Breakdown\n`;
        const sortedActions = Object.entries(summary.action_breakdown)
            .sort((a, b) => b[1] - a[1]);
        for (const [action, count] of sortedActions) {
            const pct = ((count / summary.total_transactions) * 100).toFixed(1);
            result += `- ${action}: ${count} (${pct}%)\n`;
        }
        if (summary.top_counterparties.length > 0) {
            result += `\n### 🤝 Top Counterparties\n`;
            for (const cp of summary.top_counterparties.slice(0, 5)) {
                result += `- **${cp.account}**: ${cp.count} txns (${cp.volume} Ⓝ)\n`;
            }
        }
        return result;
    }
    catch (error) {
        return `❌ Error generating summary: ${error instanceof Error ? error.message : String(error)}`;
    }
}
// Export all commands
exports.default = {
    near_history_search,
    near_history_export,
    near_history_summary,
};
//# sourceMappingURL=index.js.map