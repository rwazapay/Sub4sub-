import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { extractYouTubeId } from '../components/YouTubeEmbedPlayer';
import { EmailVerificationBanner } from '../components/EmailVerificationBanner';
import {
  Rocket,
  Video,
  Search,
  Coins,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const PromotePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Campaign type: 'subscribers' | 'views'
  const [campaignType, setCampaignType] = useState<'subscribers' | 'views'>('subscribers');
  
  // Step: 1 = Channel/Video input, 2 = Budget, 3 = Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form inputs
  const [targetUrl, setTargetUrl] = useState('');
  const [targetName, setTargetName] = useState('');
  const [targetThumbnail, setTargetThumbnail] = useState<string | null>(null);
  const [targetChannelName, setTargetChannelName] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupSuccess, setLookupSuccess] = useState(false);

  // Budget
  const [targetCount, setTargetCount] = useState<number>(20); // 20 subs or 50 views
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user) return null;

  const coinsPerAction = campaignType === 'subscribers' ? 50 : 10;
  const totalCostCoins = targetCount * coinsPerAction;

  const handleLookup = async () => {
    if (!targetUrl.trim()) return;
    setLookingUp(true);
    setErrorMsg(null);

    try {
      const res = await apiClient.get('/channels/lookup', {
        params: { url: targetUrl.trim() },
      });

      if (res.data.success && res.data.data) {
        const meta = res.data.data;
        setTargetName(meta.title || meta.channelName || 'Target Promotion');
        setTargetChannelName(meta.channelName || meta.title || null);
        setTargetThumbnail(meta.thumbnailUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
        setLookupSuccess(true);
      } else {
        // Safe fallback
        setTargetName(targetUrl.trim());
        setTargetChannelName(targetUrl.trim());
        setTargetThumbnail('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
        setLookupSuccess(true);
      }
    } catch {
      // Direct local extraction fallback so user is never blocked
      const extractedId = extractYouTubeId(targetUrl.trim());
      const fallbackThumb = extractedId 
        ? `https://i.ytimg.com/vi/${extractedId}/hqdefault.jpg`
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
      setTargetName(targetUrl.trim());
      setTargetChannelName(targetUrl.trim());
      setTargetThumbnail(fallbackThumb);
      setLookupSuccess(true);
    } finally {
      setLookingUp(false);
    }
  };

  const handleContinueToBudget = () => {
    if (!targetUrl.trim()) {
      setErrorMsg('Please enter a valid channel URL, video link, or @handle.');
      return;
    }
    if (!lookupSuccess) {
      handleLookup();
    }
    setErrorMsg(null);
    setCurrentStep(2);
  };

  const handleSubmitCampaign = async () => {
    if (user.credits < totalCostCoins) {
      setErrorMsg(`Insufficient coins. You need ${totalCostCoins} coins, but you have ${user.credits} coins.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const extractedId = extractYouTubeId(targetUrl);
      const computedEmbedUrl = extractedId ? `https://www.youtube.com/embed/${extractedId}` : undefined;

      const res = await apiClient.post('/promotions', {
        title: targetName || (campaignType === 'subscribers' ? 'Channel Promotion' : 'Video Views Promotion'),
        platform: 'YouTube',
        channelUrl: targetUrl,
        videoEmbedUrl: computedEmbedUrl,
        budgetCredits: totalCostCoins,
        durationDays: 7,
      });

      if (res.data.success) {
        updateUser({
          ...user,
          credits: res.data.data.remainingBalance,
        });
        navigate('/earn');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12 text-stone-900 dark:text-stone-100">
      <EmailVerificationBanner />
      
      {/* Title & Subtitle */}
      <div className="space-y-1 pt-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
          Create a campaign
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
          Fund coins to promote your YouTube channel or video.
        </p>
      </div>

      {/* Mode Selector Cards (Grow subscribers | Get views) */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Card 1: Grow Subscribers */}
        <button
          type="button"
          onClick={() => {
            setCampaignType('subscribers');
            setLookupSuccess(false);
            setCurrentStep(1);
          }}
          className={`p-4 rounded-3xl text-left transition-all border space-y-2 relative ${
            campaignType === 'subscribers'
              ? 'bg-red-600/5 dark:bg-[#1c1813] border-red-500 ring-1 ring-red-500'
              : 'bg-white dark:bg-[#161310] border-stone-200 dark:border-[#262018] hover:border-stone-300'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-red-600/10 text-red-500 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-extrabold text-stone-900 dark:text-white text-sm">
              Grow subscribers
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Verified against YouTube
            </p>
          </div>
        </button>

        {/* Card 2: Get Views */}
        <button
          type="button"
          onClick={() => {
            setCampaignType('views');
            setLookupSuccess(false);
            setCurrentStep(1);
          }}
          className={`p-4 rounded-3xl text-left transition-all border space-y-2 relative ${
            campaignType === 'views'
              ? 'bg-red-600/5 dark:bg-[#1c1813] border-red-500 ring-1 ring-red-500'
              : 'bg-white dark:bg-[#161310] border-stone-200 dark:border-[#262018] hover:border-stone-300'
          }`}
        >
          <div className="w-10 h-10 rounded-2xl bg-red-600/10 text-red-500 flex items-center justify-center">
            <Video className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-extrabold text-stone-900 dark:text-white text-sm">
              Get views
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Watch & earn, in-app
            </p>
          </div>
        </button>

      </div>

      {/* Step Indicator (1 Channel/Video -- 2 Budget -- 3 Review) */}
      <div className="flex items-center justify-start gap-4 text-xs font-semibold py-1">
        
        {/* Step 1 */}
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep === 1
                ? 'bg-red-600 text-stone-950'
                : 'bg-stone-200 dark:bg-[#201b16] text-stone-600 dark:text-stone-400'
            }`}
          >
            1
          </span>
          <span className={currentStep === 1 ? 'font-bold text-stone-900 dark:text-white' : 'text-stone-500'}>
            {campaignType === 'subscribers' ? 'Channel' : 'Video'}
          </span>
        </div>

        <span className="text-stone-300 dark:text-stone-700">—</span>

        {/* Step 2 */}
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep === 2
                ? 'bg-red-600 text-stone-950'
                : 'bg-stone-200 dark:bg-[#201b16] text-stone-600 dark:text-stone-400'
            }`}
          >
            2
          </span>
          <span className={currentStep === 2 ? 'font-bold text-stone-900 dark:text-white' : 'text-stone-500'}>
            Budget
          </span>
        </div>

        <span className="text-stone-300 dark:text-stone-700">—</span>

        {/* Step 3 */}
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep === 3
                ? 'bg-red-600 text-stone-950'
                : 'bg-stone-200 dark:bg-[#201b16] text-stone-600 dark:text-stone-400'
            }`}
          >
            3
          </span>
          <span className={currentStep === 3 ? 'font-bold text-stone-900 dark:text-white' : 'text-stone-500'}>
            Review
          </span>
        </div>

      </div>

      {/* Main Step Form Card */}
      <div className="bg-white dark:bg-[#161310] border border-stone-200 dark:border-[#262018] rounded-3xl p-6 shadow-xs space-y-5">
        
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: CHANNEL OR VIDEO LOOKUP */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-bold text-stone-900 dark:text-white text-xs block">
                {campaignType === 'subscribers' ? 'YouTube channel URL, @handle, or ID' : 'YouTube video URL or ID'}
              </label>

              <input
                type="text"
                value={targetUrl}
                onChange={(e) => {
                  setTargetUrl(e.target.value);
                  setLookupSuccess(false);
                }}
                placeholder={
                  campaignType === 'subscribers'
                    ? 'https://www.youtube.com/@yourchannel'
                    : 'https://www.youtube.com/watch?v=...'
                }
                className="w-full bg-stone-50 dark:bg-[#0d0b09] border border-stone-200 dark:border-[#262018] rounded-2xl px-4 py-3.5 text-stone-900 dark:text-white placeholder-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {lookupSuccess && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-semibold flex items-center gap-3">
                {targetThumbnail ? (
                  <img
                    src={targetThumbnail}
                    alt={targetName}
                    referrerPolicy="no-referrer"
                    className="w-14 h-10 object-cover rounded-lg border border-emerald-500/20 shrink-0"
                  />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-emerald-700 dark:text-emerald-300 font-bold truncate">
                    {targetName}
                  </div>
                  {targetChannelName && (
                    <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                      Channel: {targetChannelName}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Look up Button */}
            <button
              type="button"
              onClick={handleLookup}
              disabled={lookingUp || !targetUrl.trim()}
              className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-stone-950 font-bold text-xs shadow-md shadow-red-600/15 transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4 text-stone-950" />
              <span>{lookingUp ? 'Looking up...' : 'Look up'}</span>
            </button>

            {/* Continue Button */}
            <button
              type="button"
              onClick={handleContinueToBudget}
              className="w-full py-3.5 px-4 rounded-2xl bg-red-600/30 hover:bg-red-600/40 text-amber-900 dark:text-amber-200 font-bold text-xs transition-all"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2: BUDGET & TARGET SETTING */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                Set Campaign Goal
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Choose how many {campaignType === 'subscribers' ? 'subscribers' : 'views'} you want to order.
              </p>
            </div>

            <div className="space-y-3 p-4 bg-stone-50 dark:bg-[#0d0b09] rounded-2xl border border-stone-200 dark:border-[#262018]">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Target {campaignType === 'subscribers' ? 'Subscribers' : 'Views'}</span>
                <span className="text-red-500 font-mono text-sm">{targetCount}</span>
              </div>

              <input
                type="range"
                min={campaignType === 'subscribers' ? '5' : '10'}
                max={campaignType === 'subscribers' ? '100' : '500'}
                step={campaignType === 'subscribers' ? '5' : '10'}
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value, 10))}
                className="w-full accent-red-500 cursor-pointer"
              />

              <div className="flex justify-between items-center pt-2 border-t border-stone-200 dark:border-[#262018] text-xs font-bold">
                <span className="text-stone-600 dark:text-stone-400">Total Coins Required</span>
                <span className="text-red-500 flex items-center gap-1 font-mono text-sm">
                  <Coins className="w-4 h-4 fill-red-500/20" />
                  {totalCostCoins} coins
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-1/3 py-3.5 px-4 rounded-2xl bg-stone-100 dark:bg-[#201b16] text-stone-700 dark:text-stone-300 font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="w-2/3 py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md"
              >
                Continue to Review
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & LAUNCH */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                Review Your Campaign
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Confirm your campaign details before deduction.
              </p>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-[#0d0b09] rounded-2xl border border-stone-200 dark:border-[#262018] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Type:</span>
                <span className="font-bold text-stone-900 dark:text-white capitalize">{campaignType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Target:</span>
                <span className="font-bold text-red-500">{targetCount} {campaignType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Total Cost:</span>
                <span className="font-bold text-red-500 font-mono">{totalCostCoins} coins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Your Coin Balance:</span>
                <span className="font-bold text-stone-900 dark:text-white font-mono">{user.credits} coins</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-1/3 py-3.5 px-4 rounded-2xl bg-stone-100 dark:bg-[#201b16] text-stone-700 dark:text-stone-300 font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmitCampaign}
                disabled={isSubmitting || user.credits < totalCostCoins}
                className="w-2/3 py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 fill-stone-950" />
                <span>{isSubmitting ? 'Launching...' : 'Launch Campaign Now'}</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
