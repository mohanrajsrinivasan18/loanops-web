'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { Eye, EyeOff, Check, AlertCircle, ArrowRight, TrendingUp, Shield, Zap, Users, IndianRupee } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'super_admin') window.location.href = '/saas';
        else if (user.role === 'customer') window.location.href = '/customers';
        else window.location.href = '/dashboard';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const quickLogin = async (role: 'super_admin' | 'admin' | 'agent' | 'customer') => {
    const credentials = {
      super_admin: { email: 'superadmin@loan.com', password: 'super123' },
      admin: { email: 'admin@loanops.com', password: 'admin123' },
      agent: { email: 'rajesh.agent@loan.com', password: '3210' },
      customer: { email: 'customer@loan.com', password: 'customer123' },
    };

    const creds = credentials[role];
    setEmail(creds.email);
    setPassword(creds.password);
    setError('');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Premium Brand Visual */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.06),transparent_50%)]" />
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-300/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 mb-8 shadow-2xl">
            <IndianRupee className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Vatti LoanOps
          </h1>
          <p className="text-primary-100 text-xl max-w-md leading-relaxed">
            Enterprise-grade microfinance platform built for scale, transparency, and efficiency.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 mt-8">
            {[
              { icon: Shield, label: 'Bank-grade Security' },
              { icon: TrendingUp, label: 'Real-time Analytics' },
              { icon: Zap, label: 'Lightning Fast' },
              { icon: Users, label: 'Agent Management' },
            ].map((feature) => (
              <div
                key={feature.label}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/15 hover:bg-white/15 transition-colors"
              >
                <feature.icon className="w-4 h-4 text-white/90" />
                <span className="text-white/90 text-sm font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '5K+', label: 'Active Customers' },
            { value: '₹2.5Cr', label: 'Loans Processed' },
            { value: '99.9%', label: 'Uptime SLA' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-primary-100 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-premium">
              <IndianRupee className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">Vatti LoanOps</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Welcome back</h2>
            <p className="text-neutral-500 mt-2">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 bg-danger-50 text-danger-600 px-4 py-3 rounded-xl text-sm border border-danger-100 animate-scale-in">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-neutral-300 transition-all duration-200"
                    placeholder="name@company.com"
                    required
                  />
                  {email && email.includes('@') && (
                    <div className="absolute right-4 top-3.5 text-primary-500 pointer-events-none animate-scale-in">
                      <Check size={18} />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-neutral-300 transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-600 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>
                <button type="button" className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 px-4 text-base font-semibold shadow-premium disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to Dashboard
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Grid (Demo) */}
          <div className="pt-4">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 text-center">Demo Quick Login</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { 
                  role: 'super_admin' as const, 
                  label: 'Super Admin', 
                  email: 'superadmin@loan.com',
                  colors: 'from-danger-50 to-danger-100 text-danger-700 border-danger-200 hover:border-danger-300' 
                },
                { 
                  role: 'admin' as const, 
                  label: 'Admin', 
                  email: 'admin@loanops.com',
                  colors: 'from-primary-50 to-primary-100 text-primary-700 border-primary-200 hover:border-primary-300' 
                },
                { 
                  role: 'agent' as const, 
                  label: 'Agent (Rajesh)', 
                  email: 'rajesh.agent@loan.com',
                  colors: 'from-success-50 to-success-100 text-success-700 border-success-200 hover:border-success-300' 
                },
                { 
                  role: 'customer' as const, 
                  label: 'Customer', 
                  email: 'customer@loan.com',
                  colors: 'from-secondary-50 to-secondary-100 text-secondary-700 border-secondary-200 hover:border-secondary-300' 
                },
              ].map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => quickLogin(item.role)}
                  className={`text-xs flex flex-col items-center justify-center px-3 py-3 bg-gradient-to-br ${item.colors} rounded-xl transition-all border font-semibold shadow-sm hover:shadow-md active:scale-[0.98]`}
                >
                  <span className="font-bold mb-0.5">{item.label}</span>
                  <span className="text-[10px] opacity-75 font-normal">{item.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-neutral-500">
            Don&apos;t have an account?{' '}
            <a href="#" className="font-semibold text-primary-600 hover:text-primary-700 hover:underline">
              Start free trial
            </a>
          </p>

          {/* Footer Links */}
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
}
