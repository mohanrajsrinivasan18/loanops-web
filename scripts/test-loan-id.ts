/**
 * Test Script for Loan ID Generation
 * Run with: npx tsx scripts/test-loan-id.ts
 */

import { generateLoanId, isValidLoanId, parseLoanId } from '../lib/loanIdGenerator';

async function testLoanIdGeneration() {
  console.log('🧪 Testing Loan ID Generation System\n');
  console.log('=' .repeat(60));

  // Test 1: Generate loan IDs for different types
  console.log('\n📝 Test 1: Generate Loan IDs for Different Types');
  console.log('-'.repeat(60));
  
  try {
    const dailyLoan = await generateLoanId('ABC', 'daily');
    console.log(`✅ Daily Loan:   ${dailyLoan}`);
    
    const weeklyLoan = await generateLoanId('ABC', 'weekly');
    console.log(`✅ Weekly Loan:  ${weeklyLoan}`);
    
    const monthlyLoan = await generateLoanId('ABC', 'monthly');
    console.log(`✅ Monthly Loan: ${monthlyLoan}`);
  } catch (error) {
    console.error('❌ Error generating loan IDs:', error);
  }

  // Test 2: Generate sequential IDs
  console.log('\n📝 Test 2: Generate Sequential Loan IDs');
  console.log('-'.repeat(60));
  
  try {
    const loan1 = await generateLoanId('XYZ', 'daily');
    const loan2 = await generateLoanId('XYZ', 'daily');
    const loan3 = await generateLoanId('XYZ', 'daily');
    
    console.log(`✅ Loan 1: ${loan1}`);
    console.log(`✅ Loan 2: ${loan2}`);
    console.log(`✅ Loan 3: ${loan3}`);
    console.log(`✅ Sequential: ${loan1 < loan2 && loan2 < loan3 ? 'YES' : 'NO'}`);
  } catch (error) {
    console.error('❌ Error generating sequential IDs:', error);
  }

  // Test 3: Validate loan IDs
  console.log('\n📝 Test 3: Validate Loan ID Format');
  console.log('-'.repeat(60));
  
  const testIds = [
    'ABC-D-2024-001',
    'XYZ-W-2024-015',
    'MUM-M-2024-123',
    'invalid-id',
    'ABC-X-2024-001',
    '123-D-2024-001',
  ];
  
  testIds.forEach(id => {
    const isValid = isValidLoanId(id);
    console.log(`${isValid ? '✅' : '❌'} ${id.padEnd(20)} → ${isValid ? 'VALID' : 'INVALID'}`);
  });

  // Test 4: Parse loan IDs
  console.log('\n📝 Test 4: Parse Loan ID Components');
  console.log('-'.repeat(60));
  
  const parsableIds = [
    'ABC-D-2024-001',
    'XYZ-W-2024-015',
    'MUM-M-2024-123',
  ];
  
  parsableIds.forEach(id => {
    const parsed = parseLoanId(id);
    if (parsed) {
      console.log(`✅ ${id}`);
      console.log(`   Tenant: ${parsed.tenantCode}, Type: ${parsed.loanType}, Year: ${parsed.year}, Seq: ${parsed.sequence}`);
    } else {
      console.log(`❌ ${id} - Failed to parse`);
    }
  });

  // Test 5: Multi-tenant independence
  console.log('\n📝 Test 5: Multi-Tenant Independence');
  console.log('-'.repeat(60));
  
  try {
    const abcLoan1 = await generateLoanId('ABC', 'daily');
    const xyzLoan1 = await generateLoanId('XYZ', 'daily');
    const abcLoan2 = await generateLoanId('ABC', 'daily');
    const xyzLoan2 = await generateLoanId('XYZ', 'daily');
    
    console.log(`✅ ABC Tenant: ${abcLoan1}, ${abcLoan2}`);
    console.log(`✅ XYZ Tenant: ${xyzLoan1}, ${xyzLoan2}`);
    console.log(`✅ Independent sequences: ${abcLoan1.includes('-001') && xyzLoan1.includes('-001') ? 'YES' : 'NO'}`);
  } catch (error) {
    console.error('❌ Error testing multi-tenant:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!\n');
}

// Run tests
testLoanIdGeneration().catch(console.error);
