'use client';
import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageWrapper({ children, title, subtitle, actions }: PageWrapperProps) {
  return (
    <div className="min-h-screen">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-40 dark:opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(148 163 184 / 0.15) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {(title || actions) && (
          <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08),transparent_50%)]" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  {title && <h1 className="text-4xl font-bold mb-2">{title}</h1>}
                  {subtitle && <p className="text-primary-100">{subtitle}</p>}
                </div>
                {actions && <div className="flex gap-3">{actions}</div>}
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
