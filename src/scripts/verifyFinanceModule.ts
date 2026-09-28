import {
  createFeeStructureSchema,
  updateFeeStatusSchema,
  getFeeCatalogQuerySchema,
  getTransactionsQuerySchema,
  recordManualPaymentSchema,
  adjudicateRefundSchema,
} from '../modules/finance/financeSchemas';
import { financeService } from '../modules/finance/financeService';

async function runFinanceVerification() {
  console.log('=== Step 3 Verification: Finance Operations Module ===\n');

  let failedTests = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failedTests++;
    }
  }

  // 1. Test Schema Validation
  console.log('--- 1. Testing Finance Schemas ---');
  
  // Valid fee structure
  const validFee = createFeeStructureSchema.safeParse({
    name: '2024/2025 Undergraduate Tuition Fee',
    category: 'TUITION',
    amount: 150000,
    academicSession: '2024/2025',
    semester: 'FIRST_SEMESTER',
    level: 100,
    status: 'ACTIVE',
  });
  assert(validFee.success, 'Valid fee structure payload parses successfully');

  // Invalid fee structure (negative amount)
  const invalidFee = createFeeStructureSchema.safeParse({
    name: 'Bad Fee',
    category: 'TUITION',
    amount: -500,
    academicSession: '2024/2025',
  });
  assert(!invalidFee.success, 'Negative fee amount is rejected');

  // Valid fee status update
  const validStatus = updateFeeStatusSchema.safeParse({ status: 'ARCHIVED' });
  assert(validStatus.success, 'Valid fee status (ARCHIVED) parses successfully');

  const invalidStatus = updateFeeStatusSchema.safeParse({ status: 'DELETED' });
  assert(!invalidStatus.success, 'Invalid fee status (DELETED) is rejected');

  // Valid manual payment
  const validPayment = recordManualPaymentSchema.safeParse({
    studentId: '6a764f8ed8f8b20794d5024a',
    amount: 75000,
    reference: 'TEL-2024-99881',
    channel: 'BANK_BRANCH',
    session: '2024/2025',
    description: 'Bank teller deposit slip verified',
  });
  assert(validPayment.success, 'Valid manual payment payload parses successfully');

  // Valid refund adjudication
  const validRefund = adjudicateRefundSchema.safeParse({
    status: 'APPROVED',
    amountApproved: 25000,
    adjudicationNote: 'Approved due to double-billing',
    disbursementRef: 'VOUCHER-00129',
  });
  assert(validRefund.success, 'Valid refund adjudication parses successfully');

  // 2. Test FinanceService Method Availability
  console.log('\n--- 2. Testing FinanceService Methods ---');
  assert(typeof financeService.getFinancialMetrics === 'function', 'financeService.getFinancialMetrics exists');
  assert(typeof financeService.createFeeStructure === 'function', 'financeService.createFeeStructure exists');
  assert(typeof financeService.getFeeCatalog === 'function', 'financeService.getFeeCatalog exists');
  assert(typeof financeService.updateFeeStatus === 'function', 'financeService.updateFeeStatus exists');
  assert(typeof financeService.getPaymentTransactions === 'function', 'financeService.getPaymentTransactions exists');
  assert(typeof financeService.getTransactionById === 'function', 'financeService.getTransactionById exists');
  assert(typeof financeService.recordManualPayment === 'function', 'financeService.recordManualPayment exists');
  assert(typeof financeService.getRefundClaims === 'function', 'financeService.getRefundClaims exists');
  assert(typeof financeService.adjudicateRefundClaim === 'function', 'financeService.adjudicateRefundClaim exists');
  assert(typeof financeService.getStudentFinancialClearanceStatus === 'function', 'financeService.getStudentFinancialClearanceStatus exists');

  console.log(`\nVerification finished with ${failedTests} failure(s).`);
  if (failedTests > 0) {
    process.exit(1);
  }
}

runFinanceVerification();
