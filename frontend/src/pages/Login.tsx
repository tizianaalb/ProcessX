import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Activity, ArrowRight, Mail, Lock, Sparkles, TrendingUp, Zap, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        // Set token expiration for 30 days from now
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        localStorage.setItem('tokenExpiration', expirationDate.toISOString());
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('tokenExpiration');
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

        {/* Left Side - Branding */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Animated background elements */}
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="relative z-10">
              {/* Logo */}
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-xl opacity-50"></div>
                  <div className="relative p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl">
                    <Activity className="text-white" size={40} strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ProcessX
                  </h1>
                  <p className="text-slate-600 font-semibold">Enterprise Process Intelligence</p>
                </div>
              </div>

              {/* Value Props */}
              <div className="space-y-6 mb-8">
                <h2 className="text-4xl font-black text-slate-900 leading-tight">
                  Transform Your<br />
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Business Processes
                  </span>
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  AI-powered process mapping and optimization platform for enterprise teams.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <TrendingUp className="text-blue-600" size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Visual Process Mapping</h3>
                    <p className="text-sm text-slate-600">Drag-and-drop interface for intuitive process design</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Sparkles className="text-purple-600" size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">AI-Powered Insights</h3>
                    <p className="text-sm text-slate-600">Automatically identify bottlenecks and optimization opportunities</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Zap className="text-indigo-600" size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Real-time Collaboration</h3>
                    <p className="text-sm text-slate-600">Work together with your team in a shared workspace</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="relative">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-12">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                <Activity className="text-white" size={32} strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ProcessX
              </h1>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 mb-2">
                Welcome Back! 👋
              </h2>
              <p className="text-slate-600">
                Sign in to your account to continue
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="text-sm font-semibold text-red-700">{error}</div>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="text-slate-400" size={20} />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="pl-12 py-6 text-base border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="text-slate-400" size={20} />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="pl-12 pr-12 py-6 text-base border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-white border-2 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm font-semibold text-slate-700 cursor-pointer select-none"
                >
                  Remember me for 30 days
                </label>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-lg py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={20} strokeWidth={3} />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t-2 border-slate-200">
              <p className="text-center text-slate-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Create one now →
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                Secure authentication powered by ProcessX
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
