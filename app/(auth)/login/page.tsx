'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { Eye, EyeOff, Check, AlertCircle, ArrowRight, TrendingUp, Shield, Zap, Users, IndianRupee, Smartphone, Building2 } from 'lucide-react';

type LoginMode = 'password' | 'otp';
type OTPStep = 'phone' | 'verify' | 'select_profile';

export default function LoginPage() {
  const auth = useAuth();
  
  // Add safety check
  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading authentication...</p>
      </div>
    );
  }
  
  const { login, loginWithUserData } = auth;
  const [loginMode, setLoginMode] = useState<LoginMode>('password');

  // Password states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // OTP states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<OTPStep>('phone');
  const [otpToken, setOtpToken] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [tempOtp, setTempOtp] = useState(''); // For showing OTP in dev
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      redirectUser();
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const redirectUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'super_admin') window.location.href = '/super-admin';
      else if (user.role === 'customer') window.location.href = '/customers';
      else window.location.href = '/dashboard';
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const baseUrl = window.location.origin;
      console.log('🔗 Sending OTP to:', `${baseUrl}/api/auth/send-otp`, { phone });

      const res = await fetch(`${baseUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      console.log('📱 API Response:', data);

      if (res.ok) {
        setIsRegistered(!!data.isRegistered);
        setOtpStep('verify');
        if (data.otp) {
          console.log('✅ Received Test OTP:', data.otp);
          setTempOtp(data.otp);
        }
      } else {
        console.error('❌ OTP Send Failed:', data.error);
        throw new Error(data.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      console.error('🚨 Catch Error in handleSendOtp:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const baseUrl = window.location.origin;
      const res = await fetch(`${baseUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.action === 'logged_in') {
          if (loginWithUserData) {
            loginWithUserData(data.user, data.token);
            redirectUser();
          } else {
            setError('Authentication system error. Please refresh the page.');
          }
        } else if (data.action === 'select_profile') {
          setProfiles(data.profiles);
          setOtpToken(data.token);
          setOtpStep('select_profile');
        } else {
          setError('No profile found for this number');
        }
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = async (profileIndex: number) => {
    setError('');
    setLoading(true);

    try {
      const baseUrl = window.location.origin;
      const res = await fetch(`${baseUrl}/api/auth/select-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          token: otpToken,
          profileIndex
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (loginWithUserData) {
          loginWithUserData(data.user, data.token);
          redirectUser();
        } else {
          setError('Authentication system error. Please refresh the page.');
        }
      } else {
        throw new Error(data.error || 'Profile selection failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
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
    setLoginMode('password');
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
      <div className="flex flex-col justify-center items-center p-8 lg:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-premium">
              <IndianRupee className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900">Vatti LoanOps</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">
              {otpStep === 'select_profile' ? 'Choose Profile' : 'Welcome back'}
            </h2>
            <p className="text-neutral-500 mt-2">
              {otpStep === 'select_profile'
                ? 'Select which business account to access'
                : loginMode === 'password'
                  ? 'Sign in with your email to access your dashboard'
                  : otpStep === 'phone'
                    ? 'Use your registered mobile number to login'
                    : `Enter the code sent to ${phone}`}
            </p>
          </div>

          {otpStep !== 'select_profile' && (
            <div className="flex p-1 bg-neutral-100 rounded-xl">
              <button
                type="button"
                onClick={() => { setLoginMode('password'); setError(''); setOtpStep('phone'); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${loginMode === 'password' ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                <Shield size={16} />
                Password
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('otp'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${loginMode === 'otp' ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                <Smartphone size={16} />
                Mobile OTP
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-danger-50 text-danger-600 px-4 py-3 rounded-xl text-sm border border-danger-100 animate-scale-in">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {loginMode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
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
                {loading ? 'Signing in...' : 'Sign in to Dashboard'}
              </button>
            </form>
          )}

          {loginMode === 'otp' && otpStep === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2" htmlFor="phone">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-3.5 text-neutral-500 font-medium">+91</div>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-14 pr-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-neutral-300 transition-all duration-200"
                    placeholder="9876543210"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full btn-primary py-3.5 px-4 text-base font-semibold shadow-premium disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {loginMode === 'otp' && otpStep === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2" htmlFor="otp">
                  Enter 6-digit Code
                </label>
                <div className="mb-4">
                  {isRegistered === true && (
                    <div className="flex items-center gap-2 bg-success-50 text-success-700 px-3 py-2 rounded-lg text-xs border border-success-100">
                      <Check size={14} />
                      This number is already registered. Your profiles will appear after verification.
                    </div>
                  )}
                  {isRegistered === false && (
                    <div className="flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-2 rounded-lg text-xs border border-primary-100">
                      <Shield size={14} />
                      New number detected. You can create a business after verification.
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-neutral-300 transition-all duration-200"
                    placeholder="000000"
                    required
                  />
                </div>
                {tempOtp && (
                  <div className="mt-6 p-4 bg-primary-50 rounded-2xl border-2 border-primary-100 flex flex-col items-center animate-bounce-soft">
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-1">Testing Mode OTP</p>
                    <p className="text-3xl font-black text-primary-700 tracking-[0.2em]">{tempOtp}</p>
                    <p className="text-[10px] text-primary-400 mt-2">Enter this code above to continue</p>
                  </div>
                )}
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => { setOtpStep('phone'); setOtp(''); setTempOtp(''); }}
                    className="text-sm text-primary-600 font-semibold hover:underline"
                  >
                    Change phone number?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full btn-primary py-3.5 px-4 text-base font-semibold shadow-premium disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          )}

          {otpStep === 'select_profile' && (
            <div className="space-y-4">
              {profiles.map((profile, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectProfile(idx)}
                  className="w-full flex items-center gap-4 p-4 bg-white border border-neutral-200 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition-all text-left shadow-sm group"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                    <Building2 size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-neutral-900">{profile.label}</h4>
                    <p className="text-sm text-neutral-500">{profile.tenant?.name || 'Vatti LoanOps'}</p>
                  </div>
                  <ArrowRight size={18} className="text-neutral-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                </button>
              ))}

              <button
                onClick={() => { setOtpStep('phone'); setOtp(''); setProfiles([]); setOtpToken(''); }}
                className="w-full py-3 text-sm font-semibold text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                Cancel and go back
              </button>
            </div>
          )}

          <div className="pt-4">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 text-center">Demo Quick Login</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { role: 'super_admin' as const, label: 'Super Admin', email: 'superadmin@loan.com', colors: 'from-danger-50 to-danger-100 text-danger-700 border-danger-200' },
                { role: 'admin' as const, label: 'Admin', email: 'admin@loanops.com', colors: 'from-primary-50 to-primary-100 text-primary-700 border-primary-200' },
                { role: 'agent' as const, label: 'Agent (Rajesh)', email: 'rajesh.agent@loan.com', colors: 'from-success-50 to-success-100 text-success-700 border-success-200' },
                { role: 'customer' as const, label: 'Customer', email: 'customer@loan.com', colors: 'from-secondary-50 to-secondary-100 text-secondary-700 border-secondary-200' },
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
        </div>
      </div>
    </div>
  );
}
