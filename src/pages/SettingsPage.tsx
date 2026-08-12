import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { SocialChannel, PlatformType } from '../types';
import {
  Settings,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Globe2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();

  // Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('Technology');
  const [country, setCountry] = useState('Rwanda');
  const [avatar, setAvatar] = useState('');

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Channels Manager State
  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [newPlatform, setNewPlatform] = useState<PlatformType>('YouTube');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [channelMessage, setChannelMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setCategory(user.creatorCategory || 'Technology');
      setCountry(user.country || 'Rwanda');
      setAvatar(user.avatar || '');

      fetchChannels();
    }
  }, [user]);

  const fetchChannels = async () => {
    try {
      const res = await apiClient.get('/channels');
      if (res.data.success) {
        setChannels(res.data.data.channels || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);

    try {
      const res = await apiClient.put('/users/profile', {
        displayName,
        bio,
        creatorCategory: category,
        country,
        avatar,
      });

      if (res.data.success) {
        updateUser(res.data.data.user);
        setProfileMessage('🎉 Profile details saved successfully!');
        setTimeout(() => setProfileMessage(null), 3000);
      }
    } catch (err: any) {
      setProfileMessage(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName || !newChannelUrl) return;

    setIsAddingChannel(true);
    setChannelMessage(null);

    try {
      const res = await apiClient.post('/channels', {
        platform: newPlatform,
        channelName: newChannelName,
        url: newChannelUrl,
      });

      if (res.data.success) {
        setChannelMessage(`🎉 ${newPlatform} profile connected!`);
        setNewChannelName('');
        setNewChannelUrl('');
        fetchChannels();
        setTimeout(() => setChannelMessage(null), 3000);
      }
    } catch (err: any) {
      setChannelMessage(err.response?.data?.message || 'Failed to add channel.');
    } finally {
      setIsAddingChannel(false);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      const res = await apiClient.delete(`/channels/${id}`);
      if (res.data.success) {
        fetchChannels();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-400/20 to-amber-500/10 border border-yellow-500/40 rounded-3xl p-6">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-yellow-600" />
          Account & Sub4Sub Profile Settings
        </h1>
        <p className="text-xs text-slate-700 font-medium mt-1">Manage your creator profile and connected social channels for Sub4Sub & Follow4Follow</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile Info Form (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-amber-200 rounded-3xl p-6 space-y-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-yellow-600" />
            Creator Details
          </h2>

          {profileMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-bold">
              {profileMessage}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs sm:text-sm">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">Creator Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                >
                  <option value="Technology">Technology</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Education">Education</option>
                  <option value="Music">Music</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Business">Business</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Country / Region</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-slate-900"
              >
                <option value="Rwanda">Rwanda</option>
                <option value="Kenya">Kenya</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
                <option value="South Africa">South Africa</option>
                <option value="Uganda">Uganda</option>
                <option value="Global">Global</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Avatar Image URL</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Creator Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief intro about yourself and your channel content..."
                className="w-full bg-slate-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="py-3 px-6 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-yellow-500/20 active:scale-95"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>

          </form>
        </div>

        {/* Social Channels Manager (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-amber-200 rounded-3xl p-6 space-y-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-yellow-600" />
              Connected Social Channels
            </h2>

            {channelMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-bold">
                {channelMessage}
              </div>
            )}

            {/* List Existing Channels */}
            <div className="space-y-3">
              {channels.map((ch) => (
                <div key={ch.id} className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-400/30 text-yellow-900 uppercase">
                        {ch.platform}
                      </span>
                      <p className="font-bold text-slate-900">{ch.channelName}</p>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5 truncate max-w-[180px]">{ch.url}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteChannel(ch.id)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-500/10 transition-colors"
                    title="Remove Channel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Form to Add New Social Channel */}
            <form onSubmit={handleAddChannel} className="p-4 rounded-2xl bg-slate-50 border border-amber-200 space-y-3 text-xs">
              <p className="font-bold text-slate-900">Connect New Social Handle</p>

              <div className="space-y-2">
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as PlatformType)}
                  className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                >
                  <option value="YouTube">YouTube</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="X">X (Twitter)</option>
                </select>

                <input
                  type="text"
                  required
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="Channel / Handle Name"
                  className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-slate-900"
                />

                <input
                  type="url"
                  required
                  value={newChannelUrl}
                  onChange={(e) => setNewChannelUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isAddingChannel}
                className="w-full py-2.5 px-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Connect Channel</span>
              </button>
            </form>

          </div>

        </div>

      </div>

    </div>
  );
};
