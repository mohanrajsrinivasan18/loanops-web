import './globals.css';
import { BrandingProvider } from '@/lib/BrandingProvider';
import { AuthProvider } from '@/lib/AuthProvider';
import { DarkModeProvider } from '@/lib/contexts/DarkModeContext';

export const metadata = {
  title: 'LoanOps - Loan Management System',
  description: 'Complete loan operations management platform',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#0A0A0A',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LoanOps',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 't1';

  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <DarkModeProvider>
          <AuthProvider>
            <BrandingProvider tenantId={tenantId}>
              {children}
            </BrandingProvider>
          </AuthProvider>
        </DarkModeProvider>
      </body>
    </html>
  );
}
