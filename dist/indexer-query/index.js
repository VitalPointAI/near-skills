"use strict";
/**
 * NEAR Indexer Query Skill
 * Commands: near_indexer_query, near_account_activity, near_contract_calls
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.near_indexer_query = near_indexer_query;
exports.near_account_activity = near_account_activity;
exports.near_contract_calls = near_contract_calls;
exports.lookupTransaction = lookupTransaction;
const nearblocks_api_1 = require("../shared/nearblocks-api");
/**
 * Format token amount with decimals
 */
function formatTokenAmount(amount, decimals) {
    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const frac = value % divisor;
    if (frac === 0n) {
        return whole.toString();
    }
    const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
    return `${whole}.${fracStr}`;
}
/**
 * near_indexer_query - Flexible transaction history lookup
 */
async function near_indexer_query(params) {
    const { account, query_type = 'transactions', limit = 25, order = 'desc' } = params;
    if (!account) {
        return '❌ Error: account parameter is required';
    }
    try {
        let result = `## 🔍 Indexer Query: ${account}\n`;
        result += `Query Type: **${query_type}** | Order: ${order} | Limit: ${limit}\n\n`;
        switch (query_type) {
            case 'ft_transfers': {
                const response = await (0, nearblocks_api_1.getAccountFTTransactions)(account, {
                    per_page: Math.min(limit, 25),
                    order,
                });
                if (!response.txns || response.txns.length === 0) {
                    return result + '📭 No FT transfers found.';
                }
                result += `### 🪙 Fungible Token Transfers\n\n`;
                for (const tx of response.txns.slice(0, limit)) {
                    const date = (0, nearblocks_api_1.formatTimestamp)(tx.block_timestamp).split('T')[0];
                    const time = (0, nearblocks_api_1.formatTimestamp)(tx.block_timestamp).split('T')[1].slice(0, 5);
                    const amount = formatTokenAmount(tx.delta_amount, tx.ft.decimals);
                    const isReceived = tx.affected_account_id === account;
                    const direction = isReceived ? '←' : '→';
                    const other = isReceived ? tx.involved_account_id : tx.involved_account_id;
                    result += `**${date}** ${time} | ${direction} ${tx.cause}\n`;
                    result += `   Token: **${tx.ft.symbol}** (${tx.ft.name})\n`;
                    result += `   Amount: ${amount} ${tx.ft.symbol}\n`;
                    result += `   ${isReceived ? 'From' : 'To'}: ${other || 'contract'}\n`;
                    result += `   Tx: \`${tx.transaction_hash.slice(0, 12)}...\`\n\n`;
                }
                break;
            }
            case 'transactions':
            default: {
                const response = await (0, nearblocks_api_1.getAccountTransactions)(account, {
                    per_page: Math.min(limit, 25),
                    order,
                });
                if (!response.txns || response.txns.length === 0) {
                    return result + '📭 No transactions found.';
                }
                result += `### 📋 Transactions\n\n`;
                for (const tx of response.txns.slice(0, limit)) {
                    const date = (0, nearblocks_api_1.formatTimestamp)(tx.block_timestamp).split('T')[0];
                    const time = (0, nearblocks_api_1.formatTimestamp)(tx.block_timestamp).split('T')[1].slice(0, 5);
                    const status = tx.outcomes?.status ? '✅' : '❌';
                    const isSender = tx.signer_account_id === account;
                    const direction = isSender ? '→' : '←';
                    const other = isSender ? tx.receiver_account_id : tx.signer_account_id;
                    result += `${status} **${date}** ${time}\n`;
                    result += `   ${direction} ${isSender ? 'To' : 'From'}: ${other}\n`;
                    if (tx.actions && tx.actions.length > 0) {
                        const actions = tx.actions.map(a => {
                            if (a.method)
                                return `${a.action}:${a.method}`;
                            return a.action;
                        }).join(', ');
                        result += `   Actions: ${actions}\n`;
                    }
                    const deposit = (0, nearblocks_api_1.formatNear)(tx.actions_agg?.deposit || 0);
                    if (parseFloat(deposit) > 0) {
                        result += `   Amount: ${deposit} Ⓝ\n`;
                    }
                    const fee = (0, nearblocks_api_1.formatNear)(tx.outcomes_agg?.transaction_fee || 0);
                    result += `   Fee: ${fee} Ⓝ\n`;
                    result += `   Tx: \`${tx.transaction_hash.slice(0, 12)}...\` | Block: ${tx.block?.block_height}\n\n`;
                }
                break;
            }
        }
        return result;
    }
    catch (error) {
        return `❌ Error querying indexer: ${error instanceof Error ? error.message : String(error)}`;
    }
}
/**
 * near_account_activity - Comprehensive account activity
 */
async function near_account_activity(params) {
    const { account, include_receipts = true, direction = 'all', limit = 25 } = params;
    if (!account) {
        return '❌ Error: account parameter is required';
    }
    try {
        const response = await (0, nearblocks_api_1.getAccountActivities)(account);
        if (!response.activities || response.activities.length === 0) {
            return `📭 No activity found for **${account}**`;
        }
        let activities = response.activities;
        // Filter by direction
        if (direction !== 'all') {
            activities = activities.filter(a => a.direction.toLowerCase() === direction.toLowerCase());
        }
        // Filter receipts if requested
        if (!include_receipts) {
            activities = activities.filter(a => a.transaction_hash !== null);
        }
        let result = `## 📊 Account Activity: ${account}\n`;
        result += `Direction Filter: ${direction} | Include Receipts: ${include_receipts}\n\n`;
        if (activities.length === 0) {
            return result + '📭 No matching activity found.';
        }
        // Group by date for readability
        const byDate = {};
        for (const activity of activities.slice(0, limit)) {
            const date = (0, nearblocks_api_1.formatTimestamp)(activity.block_timestamp).split('T')[0];
            if (!byDate[date])
                byDate[date] = [];
            byDate[date].push(activity);
        }
        for (const [date, dayActivities] of Object.entries(byDate)) {
            result += `### 📅 ${date}\n\n`;
            for (const activity of dayActivities) {
                const time = (0, nearblocks_api_1.formatTimestamp)(activity.block_timestamp).split('T')[1].slice(0, 5);
                const direction = activity.direction === 'INBOUND' ? '⬇️' : '⬆️';
                const balance = (0, nearblocks_api_1.formatNear)(activity.absolute_nonstaked_amount);
                result += `${direction} **${time}** | ${activity.cause}\n`;
                if (activity.involved_account_id) {
                    result += `   ${activity.direction === 'INBOUND' ? 'From' : 'To'}: ${activity.involved_account_id}\n`;
                }
                result += `   Balance: ${balance} Ⓝ\n`;
                if (activity.transaction_hash) {
                    result += `   Tx: \`${activity.transaction_hash.slice(0, 12)}...\`\n`;
                }
                else if (activity.receipt_id) {
                    result += `   Receipt: \`${activity.receipt_id.slice(0, 12)}...\`\n`;
                }
                result += `   Block: ${activity.block_height}\n\n`;
            }
        }
        const remaining = activities.length - limit;
        if (remaining > 0) {
            result += `\n_...and ${remaining} more activities._`;
        }
        return result;
    }
    catch (error) {
        return `❌ Error fetching activity: ${error instanceof Error ? error.message : String(error)}`;
    }
}
/**
 * near_contract_calls - Contract interaction history
 */
async function near_contract_calls(params) {
    const { account, contract, method, limit = 25 } = params;
    if (!account) {
        return '❌ Error: account parameter is required';
    }
    try {
        // Fetch transactions
        const response = await (0, nearblocks_api_1.getAccountTransactions)(account, {
            per_page: 100, // Fetch more to filter
        });
        if (!response.txns || response.txns.length === 0) {
            return `📭 No transactions found for **${account}**`;
        }
        // Filter to function calls only
        let functionCalls = response.txns.filter(tx => tx.actions?.some(a => a.action === 'FUNCTION_CALL'));
        // Filter by contract if specified
        if (contract) {
            functionCalls = functionCalls.filter(tx => tx.receiver_account_id === contract || tx.signer_account_id === contract);
        }
        // Filter by method if specified
        if (method) {
            functionCalls = functionCalls.filter(tx => tx.actions?.some(a => a.action === 'FUNCTION_CALL' &&
                a.method?.toLowerCase().includes(method.toLowerCase())));
        }
        let result = `## 📞 Contract Calls: ${account}\n`;
        if (contract)
            result += `Contract Filter: ${contract}\n`;
        if (method)
            result += `Method Filter: ${method}\n`;
        result += '\n';
        if (functionCalls.length === 0) {
            return result + '📭 No matching contract calls found.';
        }
        result += `Found **${functionCalls.length}** contract calls\n\n`;
        for (const tx of functionCalls.slice(0, limit)) {
            const date = (0, nearblocks_api_1.formatTimestamp)(tx.block_timestamp).split('T')[0];
            const time = (0, nearblocks_api_1.formatTimestamp)(tx.block_timestamp).split('T')[1].slice(0, 5);
            const status = tx.outcomes?.status ? '✅' : '❌';
            const isCaller = tx.signer_account_id === account;
            result += `${status} **${date}** ${time}\n`;
            result += `   ${isCaller ? 'Called' : 'Called by'}: ${isCaller ? tx.receiver_account_id : tx.signer_account_id}\n`;
            // Extract function call details
            const funcCalls = tx.actions?.filter(a => a.action === 'FUNCTION_CALL') || [];
            for (const call of funcCalls) {
                result += `   📌 Method: **${call.method || 'unknown'}**\n`;
                if (call.deposit && Number(call.deposit) > 0) {
                    result += `      Deposit: ${(0, nearblocks_api_1.formatNear)(call.deposit)} Ⓝ\n`;
                }
            }
            const fee = (0, nearblocks_api_1.formatNear)(tx.outcomes_agg?.transaction_fee || 0);
            result += `   Gas Fee: ${fee} Ⓝ\n`;
            result += `   Tx: \`${tx.transaction_hash.slice(0, 12)}...\`\n\n`;
        }
        const remaining = functionCalls.length - limit;
        if (remaining > 0) {
            result += `\n_...and ${remaining} more contract calls._`;
        }
        return result;
    }
    catch (error) {
        return `❌ Error fetching contract calls: ${error instanceof Error ? error.message : String(error)}`;
    }
}
/**
 * Helper: Look up a single transaction by hash
 */
async function lookupTransaction(txHash) {
    if (!txHash) {
        return '❌ Error: transaction hash is required';
    }
    try {
        const response = await (0, nearblocks_api_1.getTransaction)(txHash);
        if (!response.txns || response.txns.length === 0) {
            return `📭 Transaction not found: ${txHash}`;
        }
        const tx = response.txns[0];
        const date = (0, nearblocks_api_1.formatTimestamp)(tx.block_timestamp);
        const status = tx.outcomes?.status ? '✅ Success' : '❌ Failed';
        let result = `## 🔍 Transaction Details\n\n`;
        result += `**Hash:** \`${tx.transaction_hash}\`\n`;
        result += `**Status:** ${status}\n`;
        result += `**Timestamp:** ${date}\n`;
        result += `**Block:** ${tx.block?.block_height}\n\n`;
        result += `**From:** ${tx.signer_account_id}\n`;
        result += `**To:** ${tx.receiver_account_id}\n\n`;
        if (tx.actions && tx.actions.length > 0) {
            result += `### Actions\n`;
            for (const action of tx.actions) {
                result += `- **${action.action}**`;
                if (action.method)
                    result += `: ${action.method}`;
                if (action.deposit && Number(action.deposit) > 0) {
                    result += ` (${(0, nearblocks_api_1.formatNear)(action.deposit)} Ⓝ)`;
                }
                result += '\n';
            }
        }
        result += `\n**Fee:** ${(0, nearblocks_api_1.formatNear)(tx.outcomes_agg?.transaction_fee || 0)} Ⓝ\n`;
        return result;
    }
    catch (error) {
        return `❌ Error looking up transaction: ${error instanceof Error ? error.message : String(error)}`;
    }
}
// Export all commands
exports.default = {
    near_indexer_query,
    near_account_activity,
    near_contract_calls,
    lookupTransaction,
};
//# sourceMappingURL=index.js.map