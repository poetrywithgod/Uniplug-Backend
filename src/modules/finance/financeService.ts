import createError from 'http-errors';
import prisma from '../../configs/prismaConfig';
import {
  FeeCategory,
  FeeStatus,
  PaymentChannel,
  PaymentStatus,
  RefundStatus,
  Semester,
} from '../../../generated/prisma';

export interface CreateFeeStructureInput {
  name: string;
  category: FeeCategory;
  amount: number;
  currency?: string;
  academicSession: string;
  semester?: Semester;
  level?: number;
  departmentId?: string;
  programmeId?: string;
  status?: FeeStatus;
}

export interface GetFeeCatalogQuery {
  academicSession?: string;
  category?: FeeCategory;
  status?: FeeStatus;
  departmentId?: string;
  level?: number;
}

export interface GetTransactionsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: PaymentStatus;
  channel?: PaymentChannel;
  session?: string;
}

export interface RecordManualPaymentInput {
  studentId: string;
  feeStructureId?: string;
  amount: number;
  reference: string;
  channel?: PaymentChannel;
  session: string;
  description?: string;
}

export interface AdjudicateRefundInput {
  status: RefundStatus;
  amountApproved?: number;
  adjudicationNote: string;
  disbursementRef?: string;
}

export class FinanceService {
  /**
   * Real-time financial monitoring snapshot:
   * Collections, outstanding amounts, daily volume, pending refund requests.
   */
  async getFinancialMetrics(tenantId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      successfulPayments,
      todayPayments,
      pendingPaymentsCount,
      pendingRefundsCount,
      activeFeeSchedulesCount,
      recentTransactions,
    ] = await Promise.all([
      // Total collected
      prisma.paymentTransaction.aggregate({
        where: { tenantId, status: 'SUCCESSFUL' },
        _sum: { amount: true },
        _count: true,
      }),
      // Today's collections
      prisma.paymentTransaction.aggregate({
        where: {
          tenantId,
          status: 'SUCCESSFUL',
          paidAt: { gte: startOfToday },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Pending collections
      prisma.paymentTransaction.count({
        where: { tenantId, status: 'PENDING' },
      }),
      // Pending refund claims
      prisma.refundClaim.count({
        where: {
          tenantId,
          status: { in: ['REQUESTED', 'UNDER_REVIEW'] },
        },
      }),
      // Active fee schedules
      prisma.feeStructure.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      // Latest 5 transactions
      prisma.paymentTransaction.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              level: true,
            },
          },
          feeStructure: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      }),
    ]);

    return {
      overview: {
        totalRevenue: successfulPayments._sum.amount || 0,
        totalSuccessfulTransactions: successfulPayments._count,
        todayRevenue: todayPayments._sum.amount || 0,
        todaySuccessfulTransactions: todayPayments._count,
        pendingTransactionsCount: pendingPaymentsCount,
        pendingRefundsCount,
        activeFeeSchedulesCount,
      },
      recentActivity: recentTransactions,
    };
  }

  /**
   * Create a new fee structure.
   */
  async createFeeStructure(
    tenantId: string,
    createdBy: string,
    payload: CreateFeeStructureInput,
  ) {
    if (payload.departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: payload.departmentId, tenantId },
      });
      if (!department) {
        throw createError(404, 'Specified department not found in this institution.');
      }
    }

    if (payload.programmeId) {
      const programme = await prisma.programme.findFirst({
        where: { id: payload.programmeId, tenantId },
      });
      if (!programme) {
        throw createError(404, 'Specified academic programme not found in this institution.');
      }
    }

    const feeStructure = await prisma.feeStructure.create({
      data: {
        tenantId,
        createdBy,
        name: payload.name.trim(),
        category: payload.category,
        amount: payload.amount,
        currency: payload.currency || 'NGN',
        academicSession: payload.academicSession,
        semester: payload.semester,
        level: payload.level,
        departmentId: payload.departmentId,
        programmeId: payload.programmeId,
        status: payload.status || 'DRAFT',
      },
    });

    return feeStructure;
  }

  /**
   * Get filterable fee catalog.
   */
  async getFeeCatalog(tenantId: string, query: GetFeeCatalogQuery) {
    const where: any = { tenantId };

    if (query.academicSession) {
      where.academicSession = query.academicSession;
    }
    if (query.category) {
      where.category = query.category;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }
    if (query.level) {
      where.level = query.level;
    }

    const fees = await prisma.feeStructure.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return fees;
  }

  /**
   * Update fee status (DRAFT -> ACTIVE -> ARCHIVED).
   */
  async updateFeeStatus(tenantId: string, feeId: string, status: FeeStatus) {
    const existing = await prisma.feeStructure.findFirst({
      where: { id: feeId, tenantId },
    });

    if (!existing) {
      throw createError(404, 'Fee structure not found.');
    }

    const updated = await prisma.feeStructure.update({
      where: { id: feeId },
      data: { status },
    });

    return updated;
  }

  /**
   * Query transaction ledger with filters and search.
   */
  async getPaymentTransactions(tenantId: string, query: GetTransactionsQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (query.status) {
      where.status = query.status;
    }
    if (query.channel) {
      where.channel = query.channel;
    }
    if (query.session) {
      where.session = query.session;
    }

    if (query.search) {
      const searchTerm = query.search.trim();
      where.OR = [
        { reference: { contains: searchTerm, mode: 'insensitive' } },
        {
          student: {
            OR: [
              { firstName: { contains: searchTerm, mode: 'insensitive' } },
              { lastName: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [total, transactions] = await Promise.all([
      prisma.paymentTransaction.count({ where }),
      prisma.paymentTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              level: true,
            },
          },
          feeStructure: {
            select: {
              id: true,
              name: true,
              category: true,
              amount: true,
            },
          },
        },
      }),
    ]);

    return {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      transactions,
    };
  }

  /**
   * Get single transaction details.
   */
  async getTransactionById(tenantId: string, transactionId: string) {
    const transaction = await prisma.paymentTransaction.findFirst({
      where: { id: transactionId, tenantId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            level: true,
            department: { select: { id: true, name: true } },
          },
        },
        feeStructure: true,
        refundClaims: true,
      },
    });

    if (!transaction) {
      throw createError(404, 'Transaction not found.');
    }

    return transaction;
  }

  /**
   * Record a verified manual teller / bank receipt payment.
   */
  async recordManualPayment(
    tenantId: string,
    reconciledBy: string,
    payload: RecordManualPaymentInput,
  ) {
    const student = await prisma.user.findFirst({
      where: { id: payload.studentId, tenantId, role: 'STUDENT' },
    });

    if (!student) {
      throw createError(404, 'Student not found in this institution.');
    }

    const existingRef = await prisma.paymentTransaction.findUnique({
      where: { reference: payload.reference },
    });

    if (existingRef) {
      throw createError(409, 'Payment reference already exists in the system.');
    }

    if (payload.feeStructureId) {
      const fee = await prisma.feeStructure.findFirst({
        where: { id: payload.feeStructureId, tenantId },
      });
      if (!fee) {
        throw createError(404, 'Specified fee schedule not found.');
      }
    }

    const transaction = await prisma.paymentTransaction.create({
      data: {
        tenantId,
        studentId: payload.studentId,
        feeStructureId: payload.feeStructureId,
        amount: payload.amount,
        reference: payload.reference.trim(),
        channel: payload.channel || 'MANUAL_RECEIPT',
        status: 'SUCCESSFUL',
        session: payload.session,
        description: payload.description || 'Manual payment receipt verified by Bursary',
        paidAt: new Date(),
        reconciledBy,
        reconciledAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        feeStructure: true,
      },
    });

    return transaction;
  }

  /**
   * Get refund claims list.
   */
  async getRefundClaims(tenantId: string, status?: RefundStatus) {
    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }

    const claims = await prisma.refundClaim.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        transaction: {
          select: {
            id: true,
            reference: true,
            amount: true,
            channel: true,
            paidAt: true,
          },
        },
      },
    });

    return claims;
  }

  /**
   * Adjudicate a student refund claim.
   */
  async adjudicateRefundClaim(
    tenantId: string,
    adjudicatedBy: string,
    claimId: string,
    payload: AdjudicateRefundInput,
  ) {
    const claim = await prisma.refundClaim.findFirst({
      where: { id: claimId, tenantId },
      include: { transaction: true },
    });

    if (!claim) {
      throw createError(404, 'Refund claim not found.');
    }

    const updatedClaim = await prisma.refundClaim.update({
      where: { id: claimId },
      data: {
        status: payload.status,
        amountApproved: payload.amountApproved ?? claim.amountRequested,
        adjudicationNote: payload.adjudicationNote,
        disbursementRef: payload.disbursementRef,
        adjudicatedBy,
        adjudicatedAt: new Date(),
      },
    });

    // If fully disbursed, update transaction status to REFUNDED
    if (payload.status === 'DISBURSED' && claim.transactionId) {
      await prisma.paymentTransaction.update({
        where: { id: claim.transactionId },
        data: { status: 'REFUNDED' },
      });
    }

    return updatedClaim;
  }

  /**
   * Evaluate a student's financial clearance status.
   * Compares active tuition and fee schedules against successful payments.
   */
  async getStudentFinancialClearanceStatus(tenantId: string, studentId: string) {
    const student = await prisma.user.findFirst({
      where: { id: studentId, tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        level: true,
        departmentId: true,
      },
    });

    if (!student) {
      throw createError(404, 'Student not found.');
    }

    // Fetch active active academic session
    const activeSession = await prisma.academicSession.findFirst({
      where: { tenantId, isActive: true },
    });

    const sessionName = activeSession?.name || 'CURRENT';

    // Fetch required active fees matching student's level and department
    const requiredFees = await prisma.feeStructure.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        academicSession: sessionName,
        OR: [
          { level: null, departmentId: null },
          { level: student.level || undefined, departmentId: null },
          { level: null, departmentId: student.departmentId || undefined },
          { level: student.level || undefined, departmentId: student.departmentId || undefined },
        ],
      },
    });

    const totalBilled = requiredFees.reduce((sum, fee) => sum + fee.amount, 0);

    // Fetch student's successful payments for this session
    const successfulPayments = await prisma.paymentTransaction.findMany({
      where: {
        tenantId,
        studentId,
        status: 'SUCCESSFUL',
        session: sessionName,
      },
    });

    const totalPaid = successfulPayments.reduce((sum, tx) => sum + tx.amount, 0);
    const balance = Math.max(0, totalBilled - totalPaid);
    const isCleared = balance === 0;

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        level: student.level,
      },
      session: sessionName,
      isCleared,
      totalBilled,
      totalPaid,
      balance,
      applicableFees: requiredFees.map((f) => ({
        id: f.id,
        name: f.name,
        category: f.category,
        amount: f.amount,
      })),
      successfulPayments: successfulPayments.map((p) => ({
        id: p.id,
        reference: p.reference,
        amount: p.amount,
        paidAt: p.paidAt,
        channel: p.channel,
      })),
    };
  }

  /**
   * Aggregated revenue/debt report with category breakdown for reporting dashboards.
   */
  async getFinancialReport(tenantId: string, query: { session?: string }) {
    const sessionFilter = query.session
      ? { session: query.session }
      : {};

    // Revenue by fee category
    const revenueByCategory = await prisma.paymentTransaction.groupBy({
      by: ['feeStructureId'],
      where: { tenantId, status: 'SUCCESSFUL', ...sessionFilter },
      _sum: { amount: true },
      _count: true,
    });

    // Fetch fee structures to map categories
    const feeStructureIds = revenueByCategory
      .map((r) => r.feeStructureId)
      .filter(Boolean) as string[];

    const feeStructures = feeStructureIds.length
      ? await prisma.feeStructure.findMany({
          where: { id: { in: feeStructureIds } },
          select: { id: true, name: true, category: true },
        })
      : [];

    const feeMap = new Map(feeStructures.map((f) => [f.id, f]));

    const categoryBreakdown = revenueByCategory.map((r) => {
      const fee = r.feeStructureId ? feeMap.get(r.feeStructureId) : null;
      return {
        feeStructureId: r.feeStructureId,
        feeName: fee?.name || 'Uncategorized',
        category: fee?.category || 'OTHER',
        totalRevenue: r._sum.amount || 0,
        transactionCount: r._count,
      };
    });

    // Channel breakdown
    const channelBreakdown = await prisma.paymentTransaction.groupBy({
      by: ['channel'],
      where: { tenantId, status: 'SUCCESSFUL', ...sessionFilter },
      _sum: { amount: true },
      _count: true,
    });

    // Totals
    const totals = await prisma.paymentTransaction.aggregate({
      where: { tenantId, status: 'SUCCESSFUL', ...sessionFilter },
      _sum: { amount: true },
      _count: true,
    });

    const pendingTotal = await prisma.paymentTransaction.aggregate({
      where: { tenantId, status: 'PENDING', ...sessionFilter },
      _sum: { amount: true },
      _count: true,
    });

    const refundedTotal = await prisma.paymentTransaction.aggregate({
      where: { tenantId, status: 'REFUNDED', ...sessionFilter },
      _sum: { amount: true },
      _count: true,
    });

    return {
      session: query.session || 'ALL',
      summary: {
        totalRevenue: totals._sum.amount || 0,
        totalSuccessfulTransactions: totals._count,
        totalPendingAmount: pendingTotal._sum.amount || 0,
        totalPendingTransactions: pendingTotal._count,
        totalRefundedAmount: refundedTotal._sum.amount || 0,
        totalRefundedTransactions: refundedTotal._count,
      },
      categoryBreakdown,
      channelBreakdown: channelBreakdown.map((c) => ({
        channel: c.channel,
        totalRevenue: c._sum.amount || 0,
        transactionCount: c._count,
      })),
    };
  }

  /**
   * Generate CSV data for financial report export.
   */
  async exportFinancialReportCSV(tenantId: string, query: { session?: string }) {
    const sessionFilter = query.session
      ? { session: query.session }
      : {};

    const transactions = await prisma.paymentTransaction.findMany({
      where: { tenantId, ...sessionFilter },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        feeStructure: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    });

    // Build CSV
    const headers = [
      'Reference',
      'Student Name',
      'Student Email',
      'Fee Name',
      'Fee Category',
      'Amount',
      'Currency',
      'Channel',
      'Status',
      'Session',
      'Paid At',
      'Reconciled At',
    ].join(',');

    const rows = transactions.map((tx) =>
      [
        tx.reference,
        `"${tx.student.firstName} ${tx.student.lastName}"`,
        tx.student.email,
        tx.feeStructure?.name || 'N/A',
        tx.feeStructure?.category || 'N/A',
        tx.amount,
        tx.currency,
        tx.channel,
        tx.status,
        tx.session,
        tx.paidAt?.toISOString() || '',
        tx.reconciledAt?.toISOString() || '',
      ].join(','),
    );

    return [headers, ...rows].join('\n');
  }
}

export const financeService = new FinanceService();
