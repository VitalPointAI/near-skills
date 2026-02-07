/**
 * NearBlocks API Client - Shared utilities for NEAR indexer skills
 * https://api.nearblocks.io/api-docs
 */
export interface Transaction {
    transaction_hash: string;
    included_in_block_hash: string;
    block_timestamp: string;
    signer_account_id: string;
    receiver_account_id: string;
    block: {
        block_height: number;
    };
    actions: Array<{
        action: string;
        method: string | null;
        deposit?: number;
        args?: any;
    }>;
    actions_agg: {
        deposit: number;
    };
    outcomes: {
        status: boolean;
    };
    outcomes_agg: {
        transaction_fee: number;
    };
}
export interface FTTransaction {
    event_index: string;
    affected_account_id: string;
    involved_account_id: string;
    delta_amount: string;
    cause: string;
    transaction_hash: string;
    block_timestamp: string;
    block: {
        block_height: number;
    };
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
export declare function getAccountTransactions(accountId: string, options?: {
    page?: number;
    per_page?: number;
    order?: 'asc' | 'desc';
    cursor?: string;
}): Promise<TxnsResponse>;
/**
 * Fetch account FT (fungible token) transactions
 */
export declare function getAccountFTTransactions(accountId: string, options?: {
    page?: number;
    per_page?: number;
    order?: 'asc' | 'desc';
    cursor?: string;
}): Promise<FTTxnsResponse>;
/**
 * Fetch account activities
 */
export declare function getAccountActivities(accountId: string, options?: {
    cursor?: string;
}): Promise<ActivitiesResponse>;
/**
 * Fetch a single transaction by hash
 */
export declare function getTransaction(txHash: string): Promise<{
    txns: Transaction[];
}>;
/**
 * Format NEAR amount from yoctoNEAR
 */
export declare function formatNear(yoctoNear: string | number): string;
/**
 * Format timestamp to human-readable date
 */
export declare function formatTimestamp(nanoTimestamp: string): string;
/**
 * Parse timestamp from nanoseconds to Date
 */
export declare function parseTimestamp(nanoTimestamp: string): Date;
/**
 * Filter transactions by date range
 */
export declare function filterByDateRange(transactions: Transaction[], startDate?: Date, endDate?: Date): Transaction[];
/**
 * Filter transactions by action type
 */
export declare function filterByActionType(transactions: Transaction[], actionTypes: string[]): Transaction[];
/**
 * Filter transactions by counterparty
 */
export declare function filterByCounterparty(transactions: Transaction[], counterparty: string, accountId: string): Transaction[];
/**
 * Filter transactions by minimum amount
 */
export declare function filterByMinAmount(transactions: Transaction[], minAmount: number): Transaction[];
/**
 * Export transactions to CSV format
 */
export declare function exportToCSV(transactions: Transaction[]): string;
/**
 * Export transactions to JSON format
 */
export declare function exportToJSON(transactions: Transaction[]): string;
/**
 * Export transactions to Markdown format
 */
export declare function exportToMarkdown(transactions: Transaction[]): string;
/**
 * Calculate summary statistics
 */
export declare function calculateSummary(transactions: Transaction[], accountId: string): {
    total_transactions: number;
    total_inflow_near: string;
    total_outflow_near: string;
    total_fees_near: string;
    net_flow_near: string;
    action_breakdown: Record<string, number>;
    top_counterparties: {
        account: string;
        count: number;
        volume: string;
    }[];
    avg_tx_per_day: number;
};
//# sourceMappingURL=nearblocks-api.d.ts.map