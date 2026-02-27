const fs = require('fs');

const files = [
    'app/api/auth/login/route.ts',
    'app/api/auth/create-test-user/route.ts',
    'app/api/auth/send-otp/route.ts',
    'app/api/auth/verify-otp/route.ts',
];

for (const file of files) {
    const p = `/Users/routedigital/Route_Digital/Sass_Products/loan/loanops-web/${file}`;
    if (!fs.existsSync(p)) continue;
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/\/\/ Handle OPTIONS for CORS preflight[\s\S]*?export async function OPTIONS[\s\S]*?\}\);?\s*\}\s*$/m, '');
    fs.writeFileSync(p, content, 'utf8');
}
