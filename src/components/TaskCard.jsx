import { Check, Clock, Calendar, RotateCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';
import { useState, useRef, useEffect, useCallback } from 'react';        
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// Variable Reward Messages (Dopamine Hook)
const CELEBRATION_MESSAGES = {
  en: [
    { text: "AWESOME!", subtext: "You're on fire!" },
    { text: "CRUSHED IT!", subtext: "Keep the momentum!" },
    { text: "LEGENDARY!", subtext: "Unstoppable force!" },
    { text: "BRILLIANT!", subtext: "Pure excellence!" },
    { text: "FLAWLESS!", subtext: "Nothing can stop you!" },
    { text: "SUPERB!", subtext: "You make it look easy!" },
    { text: "EPIC WIN!", subtext: "Champion mindset!" },
    { text: "NAILED IT!", subtext: "Precision at its finest!" }
  ],
  tr: [
    { text: "HARİKA!", subtext: "Ateş gibisin!" },
    { text: "EZDİN GEÇTİN!", subtext: "Momentum seninle!" },
    { text: "EFSANE!", subtext: "Durdurulamaz güç!" },
    { text: "MUHTEŞEM!", subtext: "Saf mükemmellik!" },
    { text: "KUSURSUZ!", subtext: "Hiçbir şey durduramaz!" },
    { text: "OLAĞANÜSTÜ!", subtext: "Çok kolay gösteriyorsun!" },
    { text: "EPİK KAZANÇ!", subtext: "Şampiyon zihniyet!" },
    { text: "TAM İSABET!", subtext: "Hassasiyet sanatı!" }
  ]
};

// Confetti Patterns (Variable Rewards)
const CONFETTI_PATTERNS = [
  // Explosion pattern
  { particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#34D399', '#10B981', '#FCD34D', '#FFFFFF'] },
  // Cannon from sides
  { particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#8B5CF6', '#6366F1', '#EC4899'] },
  // Stars pattern
  { particleCount: 80, spread: 100, origin: { y: 0.5 }, shapes: ['star'], colors: ['#FFD700', '#FFA500', '#FFFFFF'] },
  // School pride
  { particleCount: 150, spread: 180, origin: { y: 0.7 }, colors: ['#22C55E', '#3B82F6', '#EAB308', '#F43F5E'] }
];

const TaskCard = ({ task, onComplete, onUndo, onEdit, isActive, t, language }) => {
  const [isCompleted, setIsCompleted] = useState(task.completed);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState(null);
  const [showRipple, setShowRipple] = useState(false);
  const [showXPGain, setShowXPGain] = useState(false);
  
  const lastTapRef = useRef(0);
  const longPressTimer = useRef(null);
  const cardControls = useAnimation();
  const hasUserInteracted = useRef(false); // Track if user has had valid interaction

  useEffect(() => {
    setIsCompleted(task.completed);
  }, [task.completed]);

  // Haptic Feedback (Fitts' Law - Physical Response)
  // Only trigger after user has had at least one valid interaction
  const triggerHaptic = useCallback((type = 'light') => {
    // Skip if user hasn't interacted yet (Chrome blocks vibration before user gesture)
    if (!hasUserInteracted.current) return;
    
    try {
      if (window.navigator?.vibrate) {
        const patterns = {
          light: [10],
          medium: [30],
          heavy: [50, 30, 50],
          success: [50, 100, 50, 100, 100]
        };
        window.navigator.vibrate(patterns[type] || patterns.light);
      }
    } catch (e) {
      // Silently fail
    }
  }, []);

  // Double Tap Detection (Thumb Zone Optimized)
  const handleDoubleTap = useCallback((e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 350;
    
    // Mark that user has interacted (for future haptic calls)
    hasUserInteracted.current = true;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY && !isCompleted) {
      completeTask();
    } else {
      lastTapRef.current = now;
      // Don't trigger haptic on first tap - only on double tap or completion
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted]);



  // Scroll Cancellation Logic
  const startPos = useRef({ x: 0, y: 0 });
  const isScrolling = useRef(false);

  // Long Press for Edit (Fitts' Law - Clear Gesture)
  const handleLongPressStart = useCallback((e) => {
    // Store start position
    const touch = e.touches ? e.touches[0] : e;
    startPos.current = { x: touch.clientX, y: touch.clientY };
    isScrolling.current = false;

    longPressTimer.current = setTimeout(() => {
      if (!isScrolling.current) {
        triggerHaptic('medium');
        onEdit(task);
      }
    }, 600);
  }, [task, onEdit, triggerHaptic]);

  const handleTouchMove = useCallback((e) => {
    if (!longPressTimer.current) return;

    const touch = e.touches ? e.touches[0] : e;
    const deltaX = Math.abs(touch.clientX - startPos.current.x);
    const deltaY = Math.abs(touch.clientY - startPos.current.y);

    // If moved more than 10px, it's a scroll/swipe, not a static long press
    if (deltaX > 10 || deltaY > 10) {
      isScrolling.current = true;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // ... (Double Tap Logic remains same)

  // Zeigarnik Effect: The Completion Ritual
  const completeTask = async () => {
    if (isCompleted) return;
    
    // Phase 1: Immediate Visual Feedback (50ms response time for satisfaction)
    setIsCompleted(true);
    triggerHaptic('success');
    
    // Phase 2: Card Bounce Animation (Spring Physics)
    await cardControls.start({
      scale: [1, 1.05, 0.98, 1.02, 1],
      transition: { 
        duration: 0.5, 
        times: [0, 0.2, 0.4, 0.6, 1],
        ease: "easeOut"
      }
    });
    
    // Phase 3: Ripple Effect
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 1000);
    
    // Phase 4: Variable Reward - Random Message (Dopamine Spike)
    const messages = CELEBRATION_MESSAGES[language] || CELEBRATION_MESSAGES.en;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setCelebrationMessage(randomMessage);
    setShowCelebration(true);
    
    // Phase 5: Variable Confetti Pattern
    const pattern = CONFETTI_PATTERNS[Math.floor(Math.random() * CONFETTI_PATTERNS.length)];
    confetti({
      ...pattern,
      disableForReducedMotion: true
    });
    
    // Sometimes add extra confetti burst (Variable Reward)
    if (Math.random() > 0.5) {
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#8B5CF6', '#6366F1', '#EC4899']
        });
      }, 300);
    }

    // Phase 6: XP Gain Float Animation
    setShowXPGain(true);
    setTimeout(() => setShowXPGain(false), 1200);

    // Phase 7: Complete the task after celebration (Zeigarnik Relief)
    setTimeout(() => {
      onComplete(task.id);
    }, 1500);

    // Phase 8: Fade celebration
    setTimeout(() => {
      setShowCelebration(false);
      setCelebrationMessage(null);
    }, 1800);
  };

  const undoTask = (e) => {
    e.stopPropagation();
    triggerHaptic('medium');
    setIsCompleted(false);
    onUndo(task.id);
  };

  // Priority-based gradient (Cognitive Load: Visual Hierarchy)
  const getGradient = () => {
    if (isCompleted) {
      return 'bg-gradient-to-br from-emerald-600/15 via-emerald-900/10 to-black border-emerald-500/30';
    }
    
    const gradients = {
      high: 'bg-gradient-to-b from-rose-500/10 via-zinc-900/60 to-zinc-950/90 border-rose-500/20',
      medium: 'bg-gradient-to-b from-amber-500/10 via-zinc-900/60 to-zinc-950/90 border-amber-500/20',
      low: 'bg-gradient-to-b from-emerald-500/10 via-zinc-900/60 to-zinc-950/90 border-emerald-500/20'
    };

    return gradients[task.priority] || 'bg-gradient-to-b from-zinc-800/40 to-zinc-950/80 border-white/5';
  };

  const getPriorityColor = () => {
    const colors = {
      high: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-500' },
      medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' },
      low: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' }
    };
    return colors[task.priority] || colors.medium;
  };

  const priorityColor = getPriorityColor();

  return (
    <div 
      className={cn(
        "w-full h-full flex items-center justify-center p-4 relative shrink-0"
      )}
      onMouseDown={handleLongPressStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
      onTouchStart={(e) => { handleLongPressStart(e); handleDoubleTap(e); }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleLongPressEnd}
      onClick={(e) => {
        if (e.detail === 2) completeTask();
      }}
    >
      {/* Ripple Effect Container */}
      <AnimatePresence>
        {showRipple && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-32 h-32 rounded-full bg-emerald-500/30 success-ripple"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP Gain Float */}
      <AnimatePresence>
        {showXPGain && (
          <motion.div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none xp-float"
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
          >
            <div className="flex items-center gap-2 bg-purple-500/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg shadow-purple-900/50">
              <Sparkles size={16} className="text-yellow-300" />
              <span className="text-white font-black text-lg">+10 XP</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={cardControls}
        className={cn(
          "relative w-full max-w-[400px] h-[65%] -mt-30 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col justify-between p-8 backdrop-blur-xl transition-all duration-500 border",
          getGradient(),
          isActive 
            ? cn(
                "shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)] border-white/10 scale-100 blur-0",
                (isCompleted && !showCelebration) && "opacity-50 grayscale-[50%]"
              )
            : "border-transparent scale-90 opacity-40 blur-sm grayscale-[40%]"
        )}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Priority Badge - Top Right (Cognitive Load: Clear Visual Hierarchy) */}
        <div className="absolute top-6 right-6 z-20">
          <AnimatePresence>
            {isActive && !showCelebration && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  "px-4 py-2 rounded-full border backdrop-blur-md shadow-lg flex items-center gap-2",
                  priorityColor.bg, priorityColor.border, priorityColor.text
                )}
              >
                <div className={cn("w-2 h-2 rounded-full animate-pulse", priorityColor.dot)} />
                <span className="text-[11px] font-black uppercase tracking-widest">
                  {t[task.priority]}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content - Centered (Tunnel Vision Focus) */}
        <div className="z-10 flex flex-col items-center text-center justify-start pt-20 w-full gap-6 px-2 h-full">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            {/* Category - Subtle (Cognitive Load Reduction) */}
            <span className="text-xs font-bold tracking-[0.4em] text-zinc-500 uppercase">
              {t?.categories?.[task.category] || task.category}
            </span>
            
            {/* Title - Hero Text (Tunnel Vision: Single Focus Point) */}
            <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-zinc-400 drop-shadow-sm">
              {task.title}
            </h2>
          </motion.div>

          {/* Description */}
          {task.description && (
            <p className="text-base text-zinc-400 font-medium max-w-[300px] leading-relaxed line-clamp-3">
              {task.description}
            </p>
          )}
          
          {/* Metadata Pills (Fitts' Law: Larger Touch Targets) */}
          <AnimatePresence>
            {isActive && !showCelebration && (task.dueDate || task.duration) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-center gap-3 w-full pt-2"
              >
                {task.duration && (
                  <span className="flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/25 px-4 py-2.5 rounded-2xl text-xs font-bold text-indigo-300 touch-target">
                    <Clock size={14} className="text-indigo-400" /> 
                    <span className="tracking-wide">{task.duration} {t.min}</span>
                  </span>
                )}
                {task.dueDate && (
                  <span className="flex items-center gap-2 bg-cyan-500/15 border border-cyan-500/25 px-4 py-2.5 rounded-2xl text-xs font-bold text-cyan-300 touch-target">
                    <Calendar size={14} className="text-cyan-400" /> 
                    <span className="tracking-wide">
                      {new Date(task.dueDate).toLocaleDateString(
                        language === 'tr' ? 'tr-TR' : 'en-US', 
                        { day: 'numeric', month: 'short' }
                      ).toUpperCase()}
                    </span>
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Action Zone (Fitts' Law: Thumb Safe Zone) */}
        <div className="z-10 w-full pb-4">
          {!isCompleted ? (
            <div className="flex flex-col items-center justify-center space-y-3 opacity-70">
              <motion.div 
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="flex flex-col items-center gap-2"
              >
                {/* Visual swipe indicator */}
                <div className="w-1 h-10 rounded-full bg-gradient-to-b from-transparent via-white/20 to-white/30" />
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 text-center">
                  {t.doubleTap}
                </p>
              </motion.div>
            </div>
          ) : !showCelebration && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col items-center space-y-5"
            >
              {/* Completed State */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="flex items-center space-x-3 text-emerald-400"
              >
                <Check size={24} strokeWidth={4} />
                <span className="text-xl font-black uppercase tracking-tight">{t.completed}</span>
              </motion.div>
              
              {/* Undo Button (Fitts' Law: Large Touch Target) */}
              <button 
                onClick={undoTask} 
                className="w-16 h-16 flex items-center justify-center rounded-2xl bg-zinc-800/90 hover:bg-zinc-700 active:bg-zinc-600 active:scale-95 transition-all border border-white/10 text-zinc-400 hover:text-white touch-target"
                aria-label={t.undo}
              >
                <RotateCcw size={22} />
              </button>
            </motion.div>
          )}
        </div>

        {/* Celebration Overlay (Zeigarnik Release + Variable Reward) */}
        <AnimatePresence>
          {showCelebration && celebrationMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600/95 via-emerald-600/90 to-teal-600/95 backdrop-blur-md"
            >
              {/* Success Checkmark with Draw Animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 12,
                  delay: 0.1
                }}
                className="relative"
              >
                {/* Glowing Background */}
                <div className="absolute inset-0 bg-white blur-2xl opacity-40 rounded-full scale-150 animate-pulse" />
                
                {/* Check Circle */}
                <div className="relative w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-900/50">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                  >
                    <Check size={56} className="text-emerald-600" strokeWidth={4} />
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Variable Reward Message */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
                className="mt-8 text-center"
              >
                <h3 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">
                  {celebrationMessage.text}
                </h3>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-emerald-100 font-bold tracking-wide text-sm mt-3 uppercase"
                >
                  {celebrationMessage.subtext}
                </motion.p>
              </motion.div>

              {/* Decorative Particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 bg-white/30 rounded-full"
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0,
                    opacity: 1 
                  }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200,
                    scale: [0, 1, 0],
                    opacity: [1, 1, 0]
                  }}
                  transition={{ 
                    duration: 1,
                    delay: 0.3 + i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default TaskCard;
