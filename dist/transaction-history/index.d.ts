/**
 * NEAR Transaction History Skill
 * Commands: near_history_search, near_history_export, near_history_summary
 */
/**
 * near_history_search - Search transactions by criteria
 */
export declare function near_history_search(params: {
    account: string;
    from_date?: string;
    to_date?: string;
    type?: string;
    counterparty?: string;
    min_amount?: number;
    limit?: number;
}): Promise<string>;
/**
 * near_history_export - Export transactions to various formats
 */
export declare function near_history_export(params: {
    account: string;
    format?: 'csv' | 'json' | 'markdown';
    from_date?: string;
    to_date?: string;
    type?: string;
    output?: string;
}): Promise<string>;
/**
 * near_history_summary - Generate summary statistics
 */
export declare function near_history_summary(params: {
    account: string;
    from_date?: string;
    to_date?: string;
}): Promise<string>;
declare const _default: {
    near_history_search: typeof near_history_search;
    near_history_export: typeof near_history_export;
    near_history_summary: typeof near_history_summary;
};
export default _default;
//# sourceMappingURL=index.d.ts.map