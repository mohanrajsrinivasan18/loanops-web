import prisma from './lib/prisma';

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Count records
    const tenantCount = await prisma.tenant.count();
    const userCount = await prisma.user.count();
    const agentCount = await prisma.agent.count();
    const customerCount = await prisma.customer.count();
    const loanCount = await prisma.loan.count();
    const collectionCount = await prisma.collection.count();
    
    console.log('\n📊 Database Record Counts:');
    console.log(`- Tenants: ${tenantCount}`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Agents: ${agentCount}`);
    console.log(`- Customers: ${customerCount}`);
    console.log(`- Loans: ${loanCount}`);
    console.log(`- Collections: ${collectionCount}`);
    
    // Fetch actual data
    if (tenantCount > 0) {
      console.log('\n📋 Tenants:');
      const tenants = await prisma.tenant.findMany();
      tenants.forEach(t => console.log(`  - ${t.name} (${t.code})`));
    }
    
    if (userCount > 0) {
      console.log('\n👥 Users:');
      const users = await prisma.user.findMany();
      users.forEach(u => console.log(`  - ${u.name} (${u.email}) - ${u.role}`));
    }
    
    if (agentCount > 0) {
      console.log('\n🚴 Agents:');
      const agents = await prisma.agent.findMany();
      agents.forEach(a => console.log(`  - ${a.name} (${a.phone}) - ${a.area}`));
    }
    
    if (customerCount > 0) {
      console.log('\n👤 Customers:');
      const customers = await prisma.customer.findMany();
      customers.forEach(c => console.log(`  - ${c.name} (${c.phone})`));
    }
    
    console.log('\n✅ Database check complete!');
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
