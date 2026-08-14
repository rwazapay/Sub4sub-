import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { AppNotification } from '../types';
import { Bell, CheckCheck, Coins, Megaphone, ShieldCheck, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await apiClient.delete('/notifications');
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-yellow-400/20 to-amber-500/10 border border-yellow-500/40 rounded-3xl p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-yellow-600" />
            Notifications & Security Alerts
          </h1>
          <p className="text-xs text-slate-700 font-medium">Activity updates, Sub4Sub requests, credit rewards, and anti-fraud alerts</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 rounded-xl bg-white border border-amber-200 hover:bg-amber-50 text-slate-800 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark All as Read</span>
          </button>

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-amber-100/50 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-white border border-amber-200 rounded-3xl space-y-2">
          <Bell className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-bold text-slate-800 text-sm">No notifications yet</p>
          <p className="text-slate-500">You will receive alerts here when other creators subscribe to you or when you earn task credits.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all ${
                n.isRead
                  ? 'bg-white border-amber-200/60 opacity-80'
                  : 'bg-amber-50/80 border-yellow-400 shadow-sm'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-yellow-600 shrink-0 mt-0.5 shadow-sm">
                {n.type === 'credit' ? <Coins className="w-5 h-5 text-red-500 fill-amber-300" /> :
                 n.type === 'promotion' ? <Megaphone className="w-5 h-5 text-purple-600" /> :
                 n.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-red-500" /> :
                 <ShieldCheck className="w-5 h-5 text-emerald-600" />}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">{n.title}</h3>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">
                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{n.message}</p>

                {n.link && (
                  <div className="pt-1">
                    <Link
                      to={n.link}
                      onClick={() => handleMarkSingleRead(n.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 hover:underline"
                    >
                      <span>View Activity Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleDeleteNotification(n.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete Notification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
