import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { SocialChannel, PlatformType } from '../types';
import { AvatarCropperModal } from '../components/AvatarCropperModal';
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
  Crop,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { TourTriggerButton } from '../components/OnboardingWalkthrough';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();

  // Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('Technology');
  const [country, setCountry] = useState('Rwanda');
  const [avatar, setAvatar] = useState('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setProfileMessage('File size exceeds 5MB limit. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        setProfileMessage('Image uploaded! Click "Save Profile Changes" to apply.');
      };
      reader.readAsDataURL(file);
    }
  };

  const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  ];

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-stone-900 dark:text-stone-100">
      
      {/* Header */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6">
        <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-500" />
          Account & Profile Settings
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-400 font-medium mt-1">
          Update your creator profile, profile picture, display name, and connected social channels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile Info Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 space-y-6 shadow-xs">
          <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            Creator Details & Avatar
          </h2>

          {profileMessage && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              {profileMessage}
            </div>
          )}

          {/* Profile Picture Preview & Upload */}
          <div className="p-4 bg-stone-50 dark:bg-[#0d0b09] rounded-2xl border border-stone-200 dark:border-[#262018] space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-900 dark:text-white text-xs block">
                Profile Picture
              </label>
              <button
                type="button"
                onClick={() => setIsCropperOpen(true)}
                className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Crop className="w-3.5 h-3.5 text-amber-500" />
                <span>Crop & Studio Studio (MongoDB)</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={avatar || user.avatar || PRESET_AVATARS[0]}
                alt="Avatar preview"
                className="w-16 h-16 rounded-full object-cover ring-4 ring-amber-500/20 shrink-0"
              />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-stone-500 dark:text-stone-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-stone-950 hover:file:bg-amber-400 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCropperOpen(true)}
                    className="py-2 px-3 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs shrink-0 flex items-center gap-1 hover:bg-amber-400 shadow-xs active:scale-95 transition-all"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>Crop Avatar</span>
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Upload an image file or click <strong>Crop Avatar</strong> to open the Interactive Cropper Studio & save directly to MongoDB.
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-2 border-t border-stone-200/80 dark:border-[#262018]">
              <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-2">Or select a preset avatar:</p>
              <div className="flex items-center gap-2">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(preset)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 ${
                      avatar === preset ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-transparent'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Avatar Cropper Modal Component */}
          <AvatarCropperModal
            isOpen={isCropperOpen}
            onClose={() => setIsCropperOpen(false)}
            currentAvatar={avatar || user.avatar}
            onSuccess={(croppedUrl) => {
              setAvatar(croppedUrl);
              setProfileMessage('🎉 Profile avatar cropped and stored securely in MongoDB!');
            }}
          />

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs sm:text-sm">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-900 dark:text-white block">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-3.5 py-2.5 text-stone-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-900 dark:text-white block">Creator Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-3.5 py-2.5 text-stone-900 dark:text-white"
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
              <label className="font-bold text-stone-900 dark:text-white block">Country / Region</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-3.5 py-2.5 text-stone-900 dark:text-white"
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
              <label className="font-bold text-stone-900 dark:text-white block">Avatar Image Direct URL (Optional)</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-3.5 py-2.5 text-stone-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-900 dark:text-white block">Creator Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief intro about yourself and your channel content..."
                className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-3.5 py-2.5 text-stone-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-all shadow-md active:scale-95"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>

          </form>
        </div>

        {/* Social Channels Manager (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 space-y-5 shadow-xs">
            <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              Connected Social Channels
            </h2>

            {channelMessage && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                {channelMessage}
              </div>
            )}

            {/* List Existing Channels */}
            <div className="space-y-3">
              {channels.map((ch) => (
                <div key={ch.id} className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 uppercase">
                        {ch.platform}
                      </span>
                      <p className="font-bold text-stone-900 dark:text-white">{ch.channelName}</p>
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 truncate max-w-[180px]">{ch.url}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteChannel(ch.id)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Remove Channel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Form to Add New Social Channel */}
            <form onSubmit={handleAddChannel} className="p-4 rounded-2xl bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] space-y-3 text-xs">
              <p className="font-bold text-stone-900 dark:text-white">Connect New Social Handle</p>

              <div className="space-y-2">
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as PlatformType)}
                  className="w-full bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-xl px-3 py-2 text-stone-900 dark:text-white font-bold"
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
                  className="w-full bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-xl px-3 py-2 text-stone-900 dark:text-white"
                />

                <input
                  type="url"
                  required
                  value={newChannelUrl}
                  onChange={(e) => setNewChannelUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-xl px-3 py-2 text-stone-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isAddingChannel}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                <span>Connect Channel</span>
              </button>
            </form>

          </div>

          {/* Interactive Walkthrough Card */}
          <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-stone-900 dark:text-white">Interactive Guided Tour</h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              New to Sub4Sub Pro? Launch the guided walkthrough anytime to discover how the Earn exchange, Promote campaigns, and Wallet credit systems work.
            </p>
            <TourTriggerButton className="w-full justify-center py-2.5" />
          </div>

        </div>

      </div>

    </div>
  );
};
