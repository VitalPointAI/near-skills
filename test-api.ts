/**
 * Quick test script for NEAR skills API functions
 * Run with: npx tsx test-api.ts
 */

import {
  getAccountTransactions,
  getAccountFTTransactions,
  getAccountActivities,
  formatNear,
  formatTimestamp,
  calculateSummary,
  exportToCSV,
  exportToJSON,
  exportToMarkdown,
} from './shared/nearblocks-api';

async function runTests() {
  console.log('🧪 Testing NEAR Skills API Functions\n');
  
  const testAccount = 'near'; // Test with "near" account
  
  try {
    // Test 1: Get transactions
    console.log('1️⃣ Testing getAccountTransactions...');
    const txns = await getAccountTransactions(testAccount, { per_page: 5 });
    console.log(`   ✅ Fetched ${txns.txns.length} transactions`);
    console.log(`   Latest tx: ${txns.txns[0]?.transaction_hash.slice(0, 16)}...`);
    
    // Test 2: Get FT transactions
    console.log('\n2️⃣ Testing getAccountFTTransactions...');
    const ftTxns = await getAccountFTTransactions(testAccount, { per_page: 5 });
    console.log(`   ✅ Fetched ${ftTxns.txns.length} FT transactions`);
    
    // Test 3: Get activities
    console.log('\n3️⃣ Testing getAccountActivities...');
    const activities = await getAccountActivities(testAccount);
    console.log(`   ✅ Fetched ${activities.activities.length} activities`);
    
    // Test 4: Format functions
    console.log('\n4️⃣ Testing format functions...');
    const testAmount = '1000000000000000000000000'; // 1 NEAR
    console.log(`   formatNear: ${testAmount} -> ${formatNear(testAmount)} NEAR`);
    const testTimestamp = '1770483163349284308';
    console.log(`   formatTimestamp: ${testTimestamp} -> ${formatTimestamp(testTimestamp)}`);
    
    // Test 5: Export functions
    console.log('\n5️⃣ Testing export functions...');
    if (txns.txns.length > 0) {
      const csv = exportToCSV(txns.txns.slice(0, 2));
      console.log(`   CSV lines: ${csv.split('\n').length}`);
      
      const json = exportToJSON(txns.txns.slice(0, 2));
      console.log(`   JSON length: ${json.length} chars`);
      
      const md = exportToMarkdown(txns.txns.slice(0, 2));
      console.log(`   Markdown lines: ${md.split('\n').length}`);
    }
    
    // Test 6: Summary calculation
    console.log('\n6️⃣ Testing calculateSummary...');
    if (txns.txns.length > 0) {
      const summary = calculateSummary(txns.txns, testAccount);
      console.log(`   Total transactions: ${summary.total_transactions}`);
      console.log(`   Action types: ${Object.keys(summary.action_breakdown).join(', ')}`);
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
