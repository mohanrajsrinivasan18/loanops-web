import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

/**
 * POST /api/admin/cleanup-shadow-agents
 * 
 * ADMIN ONLY - Cleanup endpoint to delete all existing shadow agents
 * This should be run once to clean up any shadow agents created before the feature was finalized
 * 
 * Security: Should only be accessible to super_admin
 */
export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Unauthorized - no auth token' },
          { status: 401 }
        ),
        request
      );
    }

    // In production, verify the token is from a super_admin
    // For now, just log the action
    console.log('🧹 Cleaning up shadow agents...');

    // Find all shadow agents
    const shadowAgents = await prisma.agent.findMany({
      where: { isShadowAgent: true },
      include: { User: true },
    });

    console.log(`Found ${shadowAgents.length} shadow agents to delete`);

    // Delete shadow agents and their linked users
    const result = await prisma.$transaction(async (tx) => {
      let deletedAgents = 0;
      let deletedUsers = 0;

      for (const agent of shadowAgents) {
        // Delete linked user if exists
        if (agent.User) {
          await tx.user.delete({
            where: { id: agent.User.id },
          });
          deletedUsers++;
          console.log(`Deleted user: ${agent.User.id}`);
        }

        // Delete agent
        await tx.agent.delete({
          where: { id: agent.id },
        });
        deletedAgents++;
        console.log(`Deleted shadow agent: ${agent.id}`);
      }

      return { deletedAgents, deletedUsers };
    });

    console.log(`✅ Cleanup complete: ${result.deletedAgents} agents, ${result.deletedUsers} users deleted`);

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        message: 'Shadow agents cleaned up successfully',
        data: {
          deletedAgents: result.deletedAgents,
          deletedUsers: result.deletedUsers,
        },
      }),
      request
    );
  } catch (error: any) {
    console.error('Error cleaning up shadow agents:', error);
    return addCorsHeaders(
      NextResponse.json(
        {
          error: 'Failed to cleanup shadow agents',
          details: error.message,
        },
        { status: 500 }
      ),
      request
    );
  }
}

export async function OPTIONS() {
  return corsOptions();
}
