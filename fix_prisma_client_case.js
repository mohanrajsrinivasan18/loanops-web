const fs = require('fs');

const files = [
    'app/api/agents/register/route.ts',
    'app/api/agents/route.ts',
    'app/api/auth/send-otp/route.ts',
    'app/api/branding/route.ts',
    'app/api/collections/[id]/receipt/route.ts',
    'app/api/collections/route.ts',
    'app/api/customers/[id]/summary/route.ts',
    'app/api/dashboard/agent/route.ts',
    'app/api/my-collections/route.ts',
    'prisma/seed.ts'
];

for (const file of files) {
    const path = `/Users/routedigital/Route_Digital/Sass_Products/loan/loanops-web/${file}`;
    if (!fs.existsSync(path)) continue;

    let content = fs.readFileSync(path, 'utf8');

    // Fix prisma.Model back to prisma.model
    content = content.replace(/prisma\.Customer/g, 'prisma.customer');
    content = content.replace(/prisma\.Loan/g, 'prisma.loan');
    content = content.replace(/prisma\.Agent/g, 'prisma.agent');
    content = content.replace(/prisma\.Tenant/g, 'prisma.tenant');
    content = content.replace(/prisma\.Line/g, 'prisma.line');
    content = content.replace(/prisma\.Collection/g, 'prisma.collection');
    content = content.replace(/prisma\.User/g, 'prisma.user');

    fs.writeFileSync(path, content, 'utf8');
}
