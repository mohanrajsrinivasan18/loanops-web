import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function GET(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);

  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '5');

    const where: any = { status: 'active' };
    if (tenantId) where.tenantId = tenantId;

    // Get agents with their performance metrics
    const agents = await prisma.agent.findMany({
      where,
      include: {
        _count: {
          select: {
            Customer: true,
          },
        },
        Collection: {
          where: {
            status: 'collected',
          },
          select: {
            collectedAmount: true,
          },
        },
      },
      take: limit * 2, // Get more to filter and sort
    });

    // Calculate metrics for each agent
    const agentsWithMetrics = agents.map((agent) => {
      const totalCollections = agent.Collection.reduce(
        (sum, col) => sum + (col.collectedAmount || 0),
        0
      );
      const customerCount = agent._count.Customer;

      // Calculate efficiency (collection rate)
      // For now, use a simple metric based on collections and customers
      const efficiency = Math.min(
        100,
        Math.round((totalCollections / Math.max(customerCount * 10000, 1)) * 100)
      );

      return {
        id: agent.id,
        name: agent.name,
        collections: `₹${(totalCollections / 100000).toFixed(1)}L`,
        collectionsRaw: totalCollections,
        customers: customerCount,
        efficiency: efficiency || 0,
        avatar: agent.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase(),
      };
    });

    // Sort by collections and take top N
    const topAgents = agentsWithMetrics
      .sort((a, b) => b.collectionsRaw - a.collectionsRaw)
      .slice(0, limit)
      .map(({ collectionsRaw, ...agent }) => agent); // Remove raw amount

    return respond(
      NextResponse.json({
        success: true,
        data: topAgents,
      })
    );
  } catch (error) {
    console.error('Error fetching top agents:', error);
    return respond(
      NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch top agents',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
