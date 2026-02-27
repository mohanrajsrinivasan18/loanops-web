const fs = require('fs');

const path1 = `/Users/routedigital/Route_Digital/Sass_Products/loan/loanops-web/app/api/agents/register/route.ts`;
let content1 = fs.readFileSync(path1, 'utf8');
content1 = content1.replace(/prisma\.user\.findUnique/g, 'prisma.user.findFirst');
content1 = content1.replace(/tx\.user\.findUnique/g, 'tx.user.findFirst');
content1 = content1.replace(/tx\.Agent\./g, 'tx.agent.');
content1 = content1.replace(/result\.Agent\.id/g, 'result.agent.id');
fs.writeFileSync(path1, content1, 'utf8');

const path2 = `/Users/routedigital/Route_Digital/Sass_Products/loan/loanops-web/app/api/agents/route.ts`;
let content2 = fs.readFileSync(path2, 'utf8');
content2 = content2.replace(/prisma\.user\.findUnique\(\{\s*where:\s*\{\s*phone\s*\}\s*\}\)/g, 'prisma.user.findFirst({ where: { phone } })');
content2 = content2.replace(/tx\.Agent\./g, 'tx.agent.');
content2 = content2.replace(/result\.Agent\.id/g, 'result.agent.id');
fs.writeFileSync(path2, content2, 'utf8');

