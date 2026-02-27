import { PrismaClient } from './lib/generated/prisma';

const prisma = new PrismaClient();

async function check() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  console.log('Checking collections for:', today.toISOString().split('T')[0]);
  
  // Check collections
  const collections = await prisma.collection.findMany({
    where: {
      dueDate: {
        gte: today,
        lt: tomorrow
      }
    },
    include: {
      Customer: {
        include: {
          Line: true
        }
      },
      Agent: true,
      Loan: true
    }
  });
  
  console.log('\n=== Collections for today:', collections.length, '===');
  collections.forEach(c => {
    console.log('\nCollection ID:', c.id);
    console.log('  Customer:', c.Customer?.name);
    console.log('  Agent ID:', c.agentId);
    console.log('  Agent Name:', c.Agent?.name || 'Not assigned');
    console.log('  Line:', c.Customer?.Line?.name || 'No line');
    console.log('  Amount:', c.amount);
    console.log('  Status:', c.status);
    console.log('  Due Date:', c.dueDate);
  });
  
  // Check agents
  const agents = await prisma.agent.findMany({
    include: {
      Line: true
    }
  });
  console.log('\n=== Agents:', agents.length, '===');
  agents.forEach(a => {
    console.log('\nAgent ID:', a.id);
    console.log('  Name:', a.name);
    console.log('  Phone:', a.phone);
    console.log('  Lines:', a.Line.map(l => l.name).join(', ') || 'None');
  });
  
  await prisma.$disconnect();
}

check().catch(console.error);
