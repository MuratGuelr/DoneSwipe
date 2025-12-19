import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, User, LogOut, Moon, Zap, Flame, Trophy, Target } from 'lucide-react';

/**
 * SettingsModal - Variable Rewards & Gamification Display
 * 
 * Design Principles:
 * - Variable Rewards: XP progress, level visualization
 * - Zeigarnik Effect: Progress bars create completion motivation
 * - Fitts' Law: Large touch targets for settings
 */
const SettingsModal = ({ isOpen, onClose, user, userStats, language, setLanguage, logout, t, stats }) => {
  const completionRate = stats?.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  
  // XP progress to next level
  const currentLevelXP = Math.pow((userStats?.level || 1) - 1, 2) * 100;
  const nextLevelXP = Math.pow(userStats?.level || 1, 2) * 100;
  const xpProgress = ((userStats?.xp || 0) - currentLevelXP) / (nextLevelXP - currentLevelXP) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]"
            onClick={onClose}
          />
          
          {/* Modal - Bottom Sheet (Fitts' Law: Thumb Zone) */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-[#0f0f12]/98 backdrop-blur-2xl rounded-t-[2rem] p-6 pb-8 md:max-w-md md:mx-auto md:bottom-6 md:rounded-[2rem] border border-white/10 shadow-2xl overflow-y-auto max-h-[85vh] no-scrollbar"
          >
            {/* Handle Bar */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-white tracking-tight">{t.settings}</h3>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white flex items-center justify-center touch-target"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Profile Section - Large Touch Target */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl p-5 flex items-center space-x-4"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/10 shrink-0">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-indigo-500/20 flex items-center justify-center">
                      <User size={24} className="text-indigo-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-lg leading-tight truncate">
                    {user?.displayName || 'User'}
                  </h4>
                  <p className="text-gray-500 text-sm truncate">{user?.email}</p>
                </div>
                <motion.button 
                  onClick={logout}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all flex items-center justify-center touch-target"
                  title={t.signOut}
                >
                  <LogOut size={20} />
                </motion.button>
              </motion.div>

              {/* XP & Level Progress (Variable Rewards Visualization) */}
              {userStats && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="relative bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-purple-900/10 border border-purple-500/20 rounded-2xl p-5 overflow-hidden"
                >
                  {/* Level & XP Display */}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                        <Zap size={24} className="text-purple-400 fill-purple-400/30" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                          {t.level} {userStats.level || 1}
                        </div>
                        <div className="text-2xl font-black text-white">
                          {userStats.xp || 0} <span className="text-purple-400 text-lg">XP</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Streak Display */}
                    <div className="flex items-center gap-2 bg-orange-500/15 px-3 py-2 rounded-xl border border-orange-500/20">
                      <Flame size={18} className="text-orange-500 fill-orange-500 streak-fire" />
                      <div className="text-right">
                        <div className="text-lg font-black text-orange-400">{userStats.streak || 0}</div>
                        <div className="text-[9px] font-bold text-orange-500/60 uppercase">Streak</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* XP Progress Bar (Zeigarnik Effect: Visible Progress) */}
                  <div className="relative z-10">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                      <span className="text-purple-400">Progress</span>
                      <span className="text-gray-500">{nextLevelXP} XP to Level {(userStats.level || 1) + 1}</span>
                    </div>
                    <div className="h-3 w-full bg-purple-950/50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 relative reward-shimmer"
                      />
                    </div>
                  </div>

                  {/* Decorative Glow */}
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
                </motion.div>
              )}

              {/* Stats Grid (Zeigarnik Effect: Completion Visibility) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-3"
              >
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden hover-lift">
                  <Target size={20} className="text-emerald-400 mb-2" />
                  <span className="text-3xl font-black text-emerald-400">{stats?.total || 0}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60 mt-1">
                    {t.total}
                  </span>
                </div>
                
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden hover-lift">
                  <Trophy size={20} className="text-indigo-400 mb-2" />
                  <span className="text-3xl font-black text-indigo-400">{completionRate}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/60 mt-1">
                    {t.doneRate}
                  </span>
                  
                  {/* Fill indicator */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-indigo-500/10 transition-all duration-1000"
                    style={{ height: `${completionRate}%` }}
                  />
                </div>
              </motion.div>

              {/* Language Settings - Fitts' Law: Large Touch Targets */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 text-gray-400 ml-1">
                  <Globe size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">{t.language}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    onClick={() => setLanguage('en')}
                    whileTap={{ scale: 0.95 }}
                    className={`py-4 rounded-xl font-bold text-sm transition-all border-2 touch-target ${
                      language === 'en' 
                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10" 
                        : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10"
                    }`}
                  >
                    🇬🇧 English
                  </motion.button>
                  <motion.button
                    onClick={() => setLanguage('tr')}
                    whileTap={{ scale: 0.95 }}
                    className={`py-4 rounded-xl font-bold text-sm transition-all border-2 touch-target ${
                      language === 'tr' 
                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10" 
                        : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10"
                    }`}
                  >
                    🇹🇷 Türkçe
                  </motion.button>
                </div>
              </motion.div>

              {/* Theme Settings */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 text-gray-400 ml-1">
                  <Moon size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">{t.theme}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center space-x-3">
                    <Moon size={18} className="text-indigo-400" />
                    <span className="font-medium text-gray-300">{t.dark}</span>
                  </div>
                  <div className="w-12 h-7 bg-indigo-500/30 rounded-full relative border border-indigo-500/40">
                    <div className="absolute right-1 top-1 w-5 h-5 bg-indigo-400 rounded-full shadow-lg" />
                  </div>
                </div>
              </motion.div>

              {/* Footer */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="pt-4 text-center"
              >
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.15em]">
                  DoneSwipe v1.0.0
                </p>
                <p className="text-[9px] text-gray-700 mt-1">
                  Made with 💜 for productivity
                </p>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
