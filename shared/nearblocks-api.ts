/**
 * NearBlocks API Client - Shared utilities for NEAR indexer skills
 * https://api.nearblocks.io/api-docs
 */

const NEARBLOCKS_API = 'https://api.nearblocks.io/v1';

export interface Transaction {
  transaction_hash: string;
  included_in_block_hash: string;
  block_timestamp: string;
  signer_account_id: string;
  receiver_account_id: string;
  block: { block_height: number };
  actions: Array<{
    action: string;
    method: string | null;
    deposit?: number;
    args?: any;
  }>;
  actions_agg: { deposit: number };
  outcomes: { status: boolean };
  outcomes_agg: { transaction_fee: number };
}

export interface FTTransaction {
  event_index: string;
  affected_account_id: string;
  involved_account_id: string;
  delta_amount: string;
  cause: string;
  transaction_hash: string;
  block_timestamp: string;
  block: { block_height: number };
  ft: {
    contract: string;
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface Activity {
  event_index: string;
  block_height: string;
  transaction_hash: string | null;
  receipt_id: string | null;
  affected_account_id: string;
  involved_account_id: string | null;
  direction: 'INBOUND' | 'OUTBOUND';
  cause: string;
  absolute_nonstaked_amount: string;
  block_timestamp: string;
}

export interface TxnsResponse {
  cursor: string;
  txns: Transaction[];
}

export interface FTTxnsResponse {
  cursor: string;
  txns: FTTransaction[];
}

export interface ActivitiesResponse {
  cursor: string;
  activities: Activity[];
}

/**
 * Fetch account transactions
 */
export async function getAccountTransactions(
  accountId: string,
  options: {
    page?: number;
    per_page?: number;
    order?: 'asc' | 'desc';
    cursor?: string;
  } = {}
): Promise<TxnsResponse> {
  const { page = 1, per_page = 25, order = 'desc', cursor } = options;
  let url = `${NEARBLOCKS_API}/account/${accountId}/txns?page=${page}&per_page=${per_page}&order=${order}`;
  if (cursor) url += `&cursor=${cursor}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`);
  }
  return response.json() as Promise<TxnsResponse>;
}

/**
 * Fetch account FT (fungible token) transactions
 */
export async function getAccountFTTransactions(
  accountId: string,
  options: {
    page?: number;
    per_page?: number;
    order?: 'asc' | 'desc';
    cursor?: string;
  } = {}
): Promise<FTTxnsResponse> {
  const { page = 1, per_page = 25, order = 'desc', cursor } = options;
  let url = `${NEARBLOCKS_API}/account/${accountId}/ft-txns?page=${page}&per_page=${per_page}&order=${order}`;
  if (cursor) url += `&cursor=${cursor}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch FT transactions: ${response.statusText}`);
  }
  return response.json() as Promise<FTTxnsResponse>;
}

/**
 * Fetch account activities
 */
export async function getAccountActivities(
  accountId: string,
  options: {
    cursor?: string;
  } = {}
): Promise<ActivitiesResponse> {
  let url = `${NEARBLOCKS_API}/account/${accountId}/activities`;
  if (options.cursor) url += `?cursor=${options.cursor}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch activities: ${response.statusText}`);
  }
  return response.json() as Promise<ActivitiesResponse>;
}

/**
 * Fetch a single transaction by hash
 */
export async function getTransaction(txHash: string): Promise<{ txns: Transaction[] }> {
  const url = `${NEARBLOCKS_API}/txns/${txHash}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch transaction: ${response.statusText}`);
  }
  return response.json() as Promise<{ txns: Transaction[] }>;
}

/**
 * Format NEAR amount from yoctoNEAR
 */
export function formatNear(yoctoNear: string | number): string {
  const value = BigInt(yoctoNear.toString());
  const near = Number(value) / 1e24;
  return near.toFixed(6);
}

/**
 * Format timestamp to human-readable date
 */
export function formatTimestamp(nanoTimestamp: string): string {
  const ms = Math.floor(Number(nanoTimestamp) / 1e6);
  return new Date(ms).toISOString();
}

/**
 * Parse timestamp from nanoseconds to Date
 */
export function parseTimestamp(nanoTimestamp: string): Date {
  const ms = Math.floor(Number(nanoTimestamp) / 1e6);
  return new Date(ms);
}

/**
 * Filter transactions by date range
 */
export function filterByDateRange(
  transactions: Transaction[],
  startDate?: Date,
  endDate?: Date
): Transaction[] {
  return transactions.filter(tx => {
    const txDate = parseTimestamp(tx.block_timestamp);
    if (startDate && txDate < startDate) return false;
    if (endDate && txDate > endDate) return false;
    return true;
  });
}

/**
 * Filter transactions by action type
 */
export function filterByActionType(
  transactions: Transaction[],
  actionTypes: string[]
): Transaction[] {
  const types = actionTypes.map(t => t.toUpperCase());
  return transactions.filter(tx =>
    tx.actions?.some(a => types.includes(a.action))
  );
}

/**
 * Filter transactions by counterparty
 */
export function filterByCounterparty(
  transactions: Transaction[],
  counterparty: string,
  accountId: string
): Transaction[] {
  return transactions.filter(tx =>
    tx.signer_account_id === counterparty || 
    tx.receiver_account_id === counterparty
  );
}

/**
 * Filter transactions by minimum amount
 */
export function filterByMinAmount(
  transactions: Transaction[],
  minAmount: number
): Transaction[] {
  const minYocto = BigInt(Math.floor(minAmount * 1e24));
  return transactions.filter(tx => {
    const deposit = BigInt(tx.actions_agg?.deposit || 0);
    return deposit >= minYocto;
  });
}

/**
 * Export transactions to CSV format
 */
export function exportToCSV(transactions: Transaction[]): string {
  const headers = [
    'tx_hash',
    'date',
    'from',
    'to',
    'action',
    'amount_near',
    'fee_near',
    'status',
    'block_height'
  ];
  
  const rows = transactions.map(tx => [
    tx.transaction_hash,
    formatTimestamp(tx.block_timestamp),
    tx.signer_account_id,
    tx.receiver_account_id,
    tx.actions?.map(a => a.action).join(';') || '',
    formatNear(tx.actions_agg?.deposit || 0),
    formatNear(tx.outcomes_agg?.transaction_fee || 0),
    tx.outcomes?.status ? 'success' : 'failed',
    tx.block?.block_height || ''
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Export transactions to JSON format
 */
export function exportToJSON(transactions: Transaction[]): string {
  const formatted = transactions.map(tx => ({
    tx_hash: tx.transaction_hash,
    date: formatTimestamp(tx.block_timestamp),
    from: tx.signer_account_id,
    to: tx.receiver_account_id,
    actions: tx.actions?.map(a => ({
      type: a.action,
      method: a.method,
      deposit: a.deposit ? formatNear(a.deposit) : undefined
    })),
    amount_near: formatNear(tx.actions_agg?.deposit || 0),
    fee_near: formatNear(tx.outcomes_agg?.transaction_fee || 0),
    status: tx.outcomes?.status ? 'success' : 'failed',
    block_height: tx.block?.block_height
  }));
  
  return JSON.stringify(formatted, null, 2);
}

/**
 * Export transactions to Markdown format
 */
export function exportToMarkdown(transactions: Transaction[]): string {
  const header = `| Tx Hash | Date | From | To | Action | Amount (Ⓝ) | Status |
|---------|------|------|-----|--------|------------|--------|`;
  
  const rows = transactions.map(tx => {
    const shortHash = tx.transaction_hash.slice(0, 8) + '...';
    const date = formatTimestamp(tx.block_timestamp).split('T')[0];
    const action = tx.actions?.[0]?.action || '-';
    const amount = formatNear(tx.actions_agg?.deposit || 0);
    const status = tx.outcomes?.status ? '✅' : '❌';
    
    return `| ${shortHash} | ${date} | ${tx.signer_account_id} | ${tx.receiver_account_id} | ${action} | ${amount} | ${status} |`;
  });
  
  return [header, ...rows].join('\n');
}

/**
 * Calculate summary statistics
 */
export function calculateSummary(transactions: Transaction[], accountId: string) {
  let totalInflow = 0n;
  let totalOutflow = 0n;
  let totalFees = 0n;
  const actionCounts: Record<string, number> = {};
  const counterparties: Record<string, { count: number; volume: bigint }> = {};
  
  for (const tx of transactions) {
    const deposit = BigInt(tx.actions_agg?.deposit || 0);
    const fee = BigInt(tx.outcomes_agg?.transaction_fee || 0);
    
    if (tx.receiver_account_id === accountId) {
      totalInflow += deposit;
    } else if (tx.signer_account_id === accountId) {
      totalOutflow += deposit;
      totalFees += fee;
    }
    
    // Count action types
    for (const action of tx.actions || []) {
      actionCounts[action.action] = (actionCounts[action.action] || 0) + 1;
    }
    
    // Track counterparties
    const other = tx.signer_account_id === accountId 
      ? tx.receiver_account_id 
      : tx.signer_account_id;
    
    if (!counterparties[other]) {
      counterparties[other] = { count: 0, volume: 0n };
    }
    counterparties[other].count++;
    counterparties[other].volume += deposit;
  }
  
  // Sort counterparties by transaction count
  const topCounterparties = Object.entries(counterparties)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([account, data]) => ({
      account,
      count: data.count,
      volume: formatNear(data.volume.toString())
    }));
  
  return {
    total_transactions: transactions.length,
    total_inflow_near: formatNear(totalInflow.toString()),
    total_outflow_near: formatNear(totalOutflow.toString()),
    total_fees_near: formatNear(totalFees.toString()),
    net_flow_near: formatNear((totalInflow - totalOutflow).toString()),
    action_breakdown: actionCounts,
    top_counterparties: topCounterparties,
    avg_tx_per_day: transactions.length > 0 
      ? calculateAvgPerDay(transactions) 
      : 0
  };
}

function calculateAvgPerDay(transactions: Transaction[]): number {
  if (transactions.length < 2) return transactions.length;
  
  const dates = transactions.map(tx => parseTimestamp(tx.block_timestamp));
  const minDate = Math.min(...dates.map(d => d.getTime()));
  const maxDate = Math.max(...dates.map(d => d.getTime()));
  const days = (maxDate - minDate) / (1000 * 60 * 60 * 24);
  
  return days > 0 ? +(transactions.length / days).toFixed(2) : transactions.length;
}
