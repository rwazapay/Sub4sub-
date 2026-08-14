import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { Zap, AlertCircle, Sparkles, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState('Rwanda');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !displayName) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please check your password inputs.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiClient.post('/auth/register', {
        username,
        displayName,
        email,
        password,
        country,
      });

      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.message === 'Network Error' || !err.response) {
        setErrorMsg('Network connection error. If running on a preview domain, verify backend API reachability or sign in with the 1-click demo account.');
      } else {
        setErrorMsg(err.response?.data?.message || 'Registration failed. Please check your information.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0d0b09] text-stone-900 dark:text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-amber-500 selection:text-stone-950 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 shadow-xl shadow-amber-500/20">
              <Zap className="h-6 w-6 text-stone-950 fill-stone-950" />
            </div>
            <span className="text-2xl font-black text-stone-900 dark:text-white">
              Sub<span className="text-amber-500">Loop</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">Create Creator Account</h2>
          <p className="text-xs text-stone-600 dark:text-stone-400">Register today & instantly claim +100 Welcome Bonus Credits</p>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          
          {/* Real Google Authentication Button */}
          <div className="space-y-3">
            <GoogleAuthButton
              buttonText="Register with Google (+100 Credits)"
              onError={(msg) => setErrorMsg(msg)}
            />
            
            <div className="relative flex items-center justify-center">
              <div className="border-t border-stone-200 dark:border-[#262018] w-full" />
              <span className="bg-white dark:bg-[#161310] px-3 text-[10px] font-extrabold uppercase tracking-wider text-stone-400 absolute">
                Or Register with Email
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-900 dark:text-stone-200 block">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="tech_rwanda"
                  className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-3.5 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-900 dark:text-stone-200 block">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Tech Rwanda"
                  className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-3.5 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-900 dark:text-stone-200 block">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="creator@subloop.co"
                className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-3.5 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-900 dark:text-stone-200 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Min 6 chars"
                    className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-3.5 py-2.5 pr-10 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-900 dark:text-stone-200 block">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Repeat password"
                  className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-3.5 py-2.5 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-900 dark:text-stone-200 block">Country / Region</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-3.5 py-2.5 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
              >
                <option value="Rwanda">Rwanda</option>
                <option value="Kenya">Kenya</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
                <option value="South Africa">South Africa</option>
                <option value="Uganda">Uganda</option>
                <option value="Tanzania">Tanzania</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Global">Global / Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-stone-950" />
              <span>{isSubmitting ? 'Creating Creator Account...' : 'Register & Claim +100 Credits'}</span>
            </button>
          </form>

        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-stone-600 dark:text-stone-400 font-medium">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
            Log in to your account
          </Link>
        </p>

      </div>
    </div>
  );
};
