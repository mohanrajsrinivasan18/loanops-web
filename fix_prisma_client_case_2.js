const fs = require('fs');

const path = `/Users/routedigital/Route_Digital/Sass_Products/loan/loanops-web/app/api/dashboard/agent/route.ts`;
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/c\.customer/g, 'c.Customer');
content = content.replace(/c\.loan/g, 'c.Loan');

fs.writeFileSync(path, content, 'utf8');

const path2 = `/Users/routedigital/Route_Digital/Sass_Products/loan/loanops-web/app/api/customers/[id]/summary/route.ts`;
let content2 = fs.readFileSync(path2, 'utf8');

content2 = content2.replace(/collections: /g, 'Collection: ');
content2 = content2.replace(/loan\.collections/g, 'loan.Collection');
content2 = content2.replace(/customer\.agent/g, 'customer.Agent');
content2 = content2.replace(/customer\.tenant/g, 'customer.Tenant');

fs.writeFileSync(path2, content2, 'utf8');

const path3 = `/Users/routedigital/Route_Digital/Sass_Products/loan/loanops-web/app/api/collections/[id]/receipt/route.ts`;
let content3 = fs.readFileSync(path3, 'utf8');

content3 = content3.replace(/collection\.agent/g, 'collection.Agent');
content3 = content3.replace(/collection\.Tenant\.settings/g, 'collection.Tenant.TenantSettings');

fs.writeFileSync(path3, content3, 'utf8');

const path4 = `/Users/routedigital/Route_Digital/Sass_Products/loan/loanops-web/app/api/agents/register/route.ts`;
let content4 = fs.readFileSync(path4, 'utf8');
content4 = content4.replace(/Tenant: agent\.Tenant/g, 'Tenant: agent.Tenant'); // let me check later if needed
// Actually, earlier TS error: app/api/agents/register/route.ts:47:24 - error TS2551: Property 'Tenant' does not exist on type '{ id: string; name: string; phone: string; email: string | null; area: string | null; status: string; tenantId: string; createdAt: Date; updatedAt: Date; }'.
// Let me just replace the includes in route.ts
content4 = content4.replace(/prisma\.agent\.create\(\{/g, 'prisma.agent.create({\n      include: { Tenant: true },');
fs.writeFileSync(path4, content4, 'utf8');

const path5 = `/Users/routedigital/Route_Digital/Sass_Products/loan/loanops-web/app/api/agents/route.ts`;
let content5 = fs.readFileSync(path5, 'utf8');
content5 = content5.replace(/tenant: agent\.tenant/g, 'tenant: agent.Tenant');
content5 = content5.replace(/Tenant: agent\.tenant/g, 'Tenant: agent.Tenant');
content5 = content5.replace(/agent\.tenant/g, 'agent.Tenant');
fs.writeFileSync(path5, content5, 'utf8');

