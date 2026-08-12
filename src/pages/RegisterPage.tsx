import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { Zap, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('Rwanda');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !displayName) return;

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
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please check your information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-yellow-400 selection:text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 shadow-xl shadow-yellow-500/20">
              <Zap className="h-6 w-6 text-slate-950 fill-slate-950" />
            </div>
            <span className="text-2xl font-black text-slate-900">
              Sub<span className="text-yellow-600">Loop</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Join Sub4Sub & Follow4Follow Network</h2>
          <p className="text-xs text-slate-600">Register today and receive +100 Welcome Bonus Credits</p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-amber-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          
          {/* Real Google Authentication Button */}
          <div className="space-y-3">
            <GoogleAuthButton
              buttonText="Register with Google Account (+100 Bonus)"
              onError={(msg) => setErrorMsg(msg)}
            />
            
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 absolute">
                Or Register with Email
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. tech_rwanda"
                  className="w-full bg-slate-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Tech Rwanda"
                  className="w-full bg-slate-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@subloop.co"
                className="w-full bg-slate-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Country / Region</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-bold"
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
              className="w-full py-3.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-black text-sm shadow-md shadow-yellow-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{isSubmitting ? 'Creating Account...' : 'Register & Claim +100 Credits'}</span>
            </button>
          </form>

        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-600 font-medium">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-amber-800 hover:underline">
            Log in to your account
          </Link>
        </p>

      </div>
    </div>
  );
};
