/**
 * NEAR Indexer Query Skill
 * Commands: near_indexer_query, near_account_activity, near_contract_calls
 */
/**
 * near_indexer_query - Flexible transaction history lookup
 */
export declare function near_indexer_query(params: {
    account: string;
    query_type?: 'transactions' | 'ft_transfers' | 'nft_transfers';
    limit?: number;
    order?: 'asc' | 'desc';
}): Promise<string>;
/**
 * near_account_activity - Comprehensive account activity
 */
export declare function near_account_activity(params: {
    account: string;
    include_receipts?: boolean;
    direction?: 'inbound' | 'outbound' | 'all';
    limit?: number;
}): Promise<string>;
/**
 * near_contract_calls - Contract interaction history
 */
export declare function near_contract_calls(params: {
    account: string;
    contract?: string;
    method?: string;
    limit?: number;
}): Promise<string>;
/**
 * Helper: Look up a single transaction by hash
 */
export declare function lookupTransaction(txHash: string): Promise<string>;
declare const _default: {
    near_indexer_query: typeof near_indexer_query;
    near_account_activity: typeof near_account_activity;
    near_contract_calls: typeof near_contract_calls;
    lookupTransaction: typeof lookupTransaction;
};
export default _default;
//# sourceMappingURL=index.d.ts.map