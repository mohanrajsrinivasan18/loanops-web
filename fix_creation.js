const fs = require('fs');

const path1 = `/Users/routedigital/Route_Digital/Sass_Products/loan/loanops-web/app/api/agents/register/route.ts`;
let content1 = fs.readFileSync(path1, 'utf8');

content1 = content1.replace(
    /\/\/ Create user\s*const user = await tx\.user\.create\(\{\s*data: \{(\s*id: [^,]+,)?\s*phone,\s*email: email \|\| null,\s*password: hashedPassword,\s*role: 'agent',\s*name,\s*tenantId,?\s*\},?\s*\}\);\s*\/\/ Create agent\s*const agent = await tx\.agent\.create\(\{\s*data: \{(\s*id: [^,]+,)?\s*name,\s*phone,\s*email: email \|\| null,\s*area: area \|\| null,\s*status: 'active',\s*tenantId,?\s*userId: user\.id,?\s*\},/m,
    `// Create agent
      const agent = await tx.agent.create({
        data: {
          id: \`agent_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
          name,
          phone,
          email: email || null,
          area: area || null,
          status: 'active',
          tenantId,
        },`
);

// I need to search and replace properly.
