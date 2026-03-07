const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCustomer() {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: 'customer_1772313917190_uxrak2sb7' },
      select: {
        id: true,
        name: true,
        phone: true,
        area: true,
        lat: true,
        lng: true,
        lineId: true,
        agentId: true,
      },
    });

    console.log('Database Query Result:');
    console.log(JSON.stringify(customer, null, 2));
    console.log('\nField Types:');
    console.log('lat type:', typeof customer?.lat, 'value:', customer?.lat);
    console.log('lng type:', typeof customer?.lng, 'value:', customer?.lng);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomer();
