import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { CreatorProfile } from '../types';
import { Users, Search, Globe2, Award, ChevronRight, Zap } from 'lucide-react';

export const CreatorsDirectoryPage: React.FC = () => {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [category, setCategory] = useState('All');
  const [country, setCountry] = useState('All');
  const [search, setSearch] = useState('');

  const fetchCreators = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'All') params.append('category', category);
      if (country !== 'All') params.append('country', country);
      if (search) params.append('search', search);

      const res = await apiClient.get(`/users/creators?${params.toString()}`);
      if (res.data.success) {
        setCreators(res.data.data.creators || []);
      }
    } catch (err) {
      console.error('Failed to load creators:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, [category, country, search]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <Users className="w-4 h-4" />
          <span>Creator Network Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Discover Independent Content Creators
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Browse verified digital creators across YouTube, TikTok, Instagram, and X from Rwanda, Africa, and around the globe.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search creator name, handle, bio..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200"
            >
              <option value="All">All Categories</option>
              <option value="Technology">Technology</option>
              <option value="Gaming">Gaming</option>
              <option value="Education">Education</option>
              <option value="Music">Music</option>
              <option value="Lifestyle">Lifestyle</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200"
            >
              <option value="All">All Countries</option>
              <option value="Rwanda">Rwanda</option>
              <option value="Kenya">Kenya</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Global">Global</option>
            </select>
          </div>
        </div>
      </div>

      {/* Creators Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900 animate-pulse" />
          ))}
        </div>
      ) : creators.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-3xl">
          <Zap className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">No creators found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map((c) => (
            <Link
              key={c.id}
              to={`/creators/${c.username}`}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-4 transition-all hover:shadow-xl group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={c.avatar}
                    alt={c.displayName}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/30 group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                      {c.displayName}
                    </h3>
                    <p className="text-xs text-slate-400">@{c.username}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{c.bio}</p>

                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300">{c.category}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 flex items-center gap-1">
                    <Globe2 className="w-3 h-3" />
                    {c.country}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Award className="w-3.5 h-3.5" />
                  Reputation: {c.reputation}
                </span>

                <span className="text-indigo-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Profile <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
};
