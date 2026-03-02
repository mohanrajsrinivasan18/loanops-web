import { prisma } from './prisma';

/**
 * Create a shadow agent for a user (admin/owner)
 * Shadow agents have the same permissions as regular agents but are linked to a user
 */
export async function createShadowAgent(
  userId: string,
  tenantId: string,
  userName: string,
  userPhone?: string
) {
  try {
    // Check if shadow agent already exists for this user
    const existingShadow = await prisma.agent.findFirst({
      where: {
        User: {
          id: userId,
        },
        isShadowAgent: true,
        tenantId,
      },
    });

    if (existingShadow) {
      console.log('Shadow agent already exists for user:', userId);
      return existingShadow;
    }

    // Create shadow agent
    const shadowAgent = await prisma.agent.create({
      data: {
        name: `${userName} (Admin)`,
        phone: userPhone || 'admin-shadow',
        email: undefined,
        area: 'Admin Area',
        status: 'active',
        targetCollection: 0,
        isShadowAgent: true,
        tenantId,
      },
    });

    // Link the shadow agent to the user
    await prisma.user.update({
      where: { id: userId },
      data: { agentId: shadowAgent.id },
    });

    console.log('Shadow agent created:', shadowAgent.id);
    return shadowAgent;
  } catch (error) {
    console.error('Error creating shadow agent:', error);
    throw error;
  }
}

/**
 * Get shadow agent for a user
 */
export async function getShadowAgent(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Agent: {
          where: { isShadowAgent: true },
        },
      },
    });

    return user?.Agent || null;
  } catch (error) {
    console.error('Error getting shadow agent:', error);
    return null;
  }
}

/**
 * Check if user has a shadow agent
 */
export async function hasShadowAgent(userId: string): Promise<boolean> {
  try {
    const shadowAgent = await getShadowAgent(userId);
    return !!shadowAgent;
  } catch {
    return false;
  }
}
