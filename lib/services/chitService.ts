/**
 * Chit Fund Service
 * Handles all chit fund operations
 */

import { prisma } from '../prisma';

export const chitService = {
  /**
   * Create new chit fund
   */
  create: async (data: {
    chitName: string;
    chitValue: number;
    duration: number;
    memberCount: number;
    monthlyAmount: number;
    startDate: Date;
    agentId?: string;
    tenantId: string;
  }) => {
    return await prisma.chit.create({
      data: {
        ...data,
        status: 'active',
        productType: 'CHIT',
      },
      include: {
        Agent: true,
        ChitMembers: {
          include: {
            Customer: true,
          },
        },
      },
    });
  },

  /**
   * Get all chits for tenant
   */
  getAll: async (tenantId: string, filters?: {
    status?: string;
    agentId?: string;
  }) => {
    return await prisma.chit.findMany({
      where: {
        tenantId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.agentId && { agentId: filters.agentId }),
      },
      include: {
        Agent: true,
        ChitMembers: {
          include: {
            Customer: true,
          },
        },
        ChitAuctions: {
          orderBy: { monthNumber: 'asc' },
        },
        _count: {
          select: {
            ChitMembers: true,
            ChitPayments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get chit by ID
   */
  getById: async (id: string, tenantId: string) => {
    return await prisma.chit.findFirst({
      where: { id, tenantId },
      include: {
        Agent: true,
        ChitMembers: {
          include: {
            Customer: true,
            ChitPayments: {
              orderBy: { monthNumber: 'asc' },
            },
          },
          orderBy: { memberNumber: 'asc' },
        },
        ChitAuctions: {
          orderBy: { monthNumber: 'asc' },
        },
        ChitPayments: {
          include: {
            ChitMember: {
              include: {
                Customer: true,
              },
            },
          },
          orderBy: { monthNumber: 'asc' },
        },
      },
    });
  },

  /**
   * Update chit
   */
  update: async (id: string, tenantId: string, data: any) => {
    return await prisma.chit.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Delete chit
   */
  delete: async (id: string, tenantId: string) => {
    return await prisma.chit.delete({
      where: { id },
    });
  },

  /**
   * Add member to chit
   */
  addMember: async (data: {
    chitId: string;
    customerId: string;
    memberNumber: number;
    tenantId: string;
  }) => {
    return await prisma.chitMember.create({
      data,
      include: {
        Customer: true,
        Chit: true,
      },
    });
  },

  /**
   * Get chit members
   */
  getMembers: async (chitId: string, tenantId: string) => {
    return await prisma.chitMember.findMany({
      where: { chitId, tenantId },
      include: {
        Customer: true,
        ChitPayments: {
          orderBy: { monthNumber: 'asc' },
        },
      },
      orderBy: { memberNumber: 'asc' },
    });
  },

  /**
   * Record chit payment
   */
  recordPayment: async (data: {
    chitId: string;
    chitMemberId: string;
    monthNumber: number;
    amount: number;
    paymentDate: Date;
    tenantId: string;
  }) => {
    return await prisma.chitPayment.create({
      data: {
        ...data,
        status: 'paid',
      },
      include: {
        ChitMember: {
          include: {
            Customer: true,
          },
        },
      },
    });
  },

  /**
   * Get pending payments for a month
   */
  getPendingPayments: async (chitId: string, monthNumber: number, tenantId: string) => {
    return await prisma.chitPayment.findMany({
      where: {
        chitId,
        monthNumber,
        tenantId,
        status: 'pending',
      },
      include: {
        ChitMember: {
          include: {
            Customer: true,
          },
        },
      },
    });
  },

  /**
   * Create auction
   */
  createAuction: async (data: {
    chitId: string;
    monthNumber: number;
    auctionDate: Date;
    tenantId: string;
  }) => {
    return await prisma.chitAuction.create({
      data: {
        ...data,
        status: 'pending',
      },
      include: {
        Chit: {
          include: {
            ChitMembers: {
              include: {
                Customer: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Complete auction
   */
  completeAuction: async (
    auctionId: string,
    winnerMemberId: string,
    bidAmount: number,
    dividendAmount: number,
    tenantId: string
  ) => {
    // Update auction
    const auction = await prisma.chitAuction.update({
      where: { id: auctionId },
      data: {
        winnerMemberId,
        bidAmount,
        dividendAmount,
        status: 'completed',
      },
      include: {
        Chit: true,
      },
    });

    // Mark winner member as having won
    await prisma.chitMember.update({
      where: { id: winnerMemberId },
      data: {
        hasWonAuction: true,
        wonAuctionMonth: auction.monthNumber,
      },
    });

    return auction;
  },

  /**
   * Get chit statistics
   */
  getStatistics: async (tenantId: string) => {
    const [totalChits, activeChits, totalMembers, totalValue] = await Promise.all([
      prisma.chit.count({ where: { tenantId } }),
      prisma.chit.count({ where: { tenantId, status: 'active' } }),
      prisma.chitMember.count({ where: { tenantId } }),
      prisma.chit.aggregate({
        where: { tenantId, status: 'active' },
        _sum: { chitValue: true },
      }),
    ]);

    return {
      totalChits,
      activeChits,
      totalMembers,
      totalValue: totalValue._sum.chitValue || 0,
    };
  },
};
