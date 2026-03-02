/**
 * Cleanup Script: Remove all existing shadow agents
 * 
 * Run with: npx tsx scripts/cleanup-shadow-agents.ts
 * 
 * Note: This script requires a valid DATABASE_URL connection
 */

import { prisma } from '../lib/prisma';

async function cleanupShadowAgents() {
  try {
    console.log('🧹 Starting shadow agent cleanup...\n');
    console.log('Connecting to database...');

    // Find all shadow agents
    const shadowAgents = await prisma.agent.findMany({
      where: { isShadowAgent: true },
      include: { User: true },
    });

    console.log(`Found ${shadowAgents.length} shadow agents\n`);

    if (shadowAgents.length === 0) {
      console.log('✅ No shadow agents to clean up');
      process.exit(0);
    }

    // Delete in transaction
    const result = await prisma.$transaction(async (tx) => {
      let deletedAgents = 0;
      let deletedUsers = 0;

      for (const agent of shadowAgents) {
        console.log(`Processing agent: ${agent.name} (${agent.id})`);

        // Delete linked user if exists
        if (agent.User) {
          await tx.user.delete({
            where: { id: agent.User.id },
          });
          deletedUsers++;
          console.log(`  ✓ Deleted user: ${agent.User.email}`);
        }

        // Delete agent
        await tx.agent.delete({
          where: { id: agent.id },
        });
        deletedAgents++;
        console.log(`  ✓ Deleted shadow agent\n`);
      }

      return { deletedAgents, deletedUsers };
    });

    console.log('✅ Cleanup complete!');
    console.log(`   Deleted ${result.deletedAgents} shadow agents`);
    console.log(`   Deleted ${result.deletedUsers} linked users\n`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error during cleanup:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check DATABASE_URL and DIRECT_URL in .env');
    console.error('2. Verify database credentials are correct');
    console.error('3. Ensure you have network access to the database');
    console.error('4. Try running: npm run db:migrate first\n');
    process.exit(1);
  }
}

cleanupShadowAgents();
