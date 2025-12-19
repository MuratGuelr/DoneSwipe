import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ListTodo, Check, Sparkles, ChevronDown } from 'lucide-react';
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import TaskCard from './TaskCard';

/**
 * StackedCard - Individual Card Logic
 * 
 * Handles the visual transformation of a card based on scroll progress.
 * Logic:
 * - If card is "active" (at index), it is scale 1, opacity 1.
 * - If card is "next" (index + 1), it is behind, scale < 1, stacked visually.
 * - If card is "past" (index - 1), it flies up and away.
 */
const StackedCard = ({ 
  task, 
  index, 
  total, 
  scrollYProgress, 
  activeIndex,
  onComplete, 
  onUndo, 
  onEdit, 
  onDelete, 
  t, 
  language 
}) => {
  // Harika bir stack efekti için kartın "akış içindeki" konumunu hesaplıyoruz
  // position: 
  // 0 -> Kart tam sahnede (aktif)
  // 1 -> Kart bir sonraki sırada (arkada)
  // -1 -> Kart yukarı çıkmış (bitmiş/geçilmiş)
  const position = useTransform(scrollYProgress, (p) => {
    // 0..1 arasındaki progress'i 0..total (index) değerine çeviriyoruz
    const currentScrollIndex = p * total;
    return index - currentScrollIndex;
  });

  // Scale: Arkadaki kartlar küçülür, öndeki (0) tam boyuttur
  const scale = useTransform(position, (pos) => {
    // Kart yukarı gidiyorsa (pos < 0) biraz küçülerek gitsin
    if (pos < 0) return 1; 
    
    // Arkadaki kartlar (pos > 0) kademeli küçülür
    // Örn: 1. arkadaki 0.95, 2. arkadaki 0.90
    return Math.max(0.85, 1 - (pos * 0.05));
  });

  // Vertical Position (Y): 
  // - Aktif kart (0) ortadadır.
  // - Geçmiş kart (< 0) yukarı uçar (-1000px).
  // - Gelecek kart (> 0) hafifçe aşağıda istiflenir (stack effect).
  const y = useTransform(position, (pos) => {
    // Kart yukarı uçuyor (Ciddi bir negatif değer ile ekrandan atıyoruz)
    if (pos < -0.5) return -2000; // Tamamen gitti
    if (pos < 0) return pos * 1500; // Hızlıca yukarı çıkış
    
    // Yığın efekti: Arkadakiler hafifçe aşağıda dursun ki "deste" gibi görünsün
    // Her bir kart 15px daha aşağıda
    return pos * 15; 
  });

  // Opacity & Blur
  const opacity = useTransform(position, (pos) => {
    if (pos < -0.8) return 0; // Çok yukarıda görünmez
    if (pos < 0) return 1; // Aktifken tam görünür, yukarı çıkarken yavaşça sönmez (net kalsın)
    // Arkadaki 4. karttan sonrası görünmesin (limit stack)
    if (pos > 3) return 0;
    // Arkadakiler hafif silik
    return Math.max(0.4, 1 - (pos * 0.2));
  });

  const blur = useTransform(position, (pos) => {
    if (pos <= 0.1) return '0px';
    // Arkadakiler flu olsun (Focus efekt)
    return '4px';
  });
  
  // Z-index: En küçük index (ilk kart) en üstte olmalı
  // Ancak bizim scroll mantığında (yukarı gidenler) sorun yok
  // Mantık: Arkadakiler (index büyük) altta kalmalı.
  const zIndex = Math.round(100 - index);

  // Kartın tıklanabilirliği sadece aktif veya çok yakınken olsun
  const [isInteractive, setIsInteractive] = useState(false);
  
  useMotionValueEvent(position, "change", (latest) => {
    setIsInteractive(latest > -0.5 && latest < 1);
  });

  return (
    <motion.div
      style={{
        zIndex,
        y,
        scale,
        opacity,
        filter: useTransform(blur, b => `blur(${b})`),
        position: 'absolute',
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: isInteractive ? 'auto' : 'none'
      }}
      className="w-full h-full p-4 will-change-transform"
    >
      <div className="w-full h-full max-h-[100vh] flex items-center justify-center">
        <TaskCard 
          task={task} 
          isActive={index === activeIndex} 
          onComplete={onComplete} 
          onUndo={onUndo}
          onEdit={onEdit}
          onDelete={onDelete}
          t={t}
          language={language}
        />
      </div>
    </motion.div>
  );
};

const TaskFeed = ({ tasks, onTaskComplete, onUndo, onEdit, onDelete, t, language, sortOrder, onFocusModeChange }) => {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({ 
    container: containerRef,
    // layoutEffect: false 
  });

  // Sort değişince başa sar
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [sortOrder]);

  // Aktif index takibi ve Focus Mode
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Progress (0..1) -> Index (0..Total + 1 for clear finish)
    // Fix: Allow going one step further to clear the last card
    const maxIndex = tasks.length;
    const rawIndex = latest * maxIndex;
    const index = Math.min(Math.round(rawIndex), tasks.length - 1);
    
    if (index !== activeIndex && index < tasks.length) {
      setActiveIndex(index);
    }

    // Biraz scroll yapıldıysa focus mode aç
    onFocusModeChange?.(latest > 0.02 && latest < 0.98);
  });

  // Sadece tamamlanmamış görevlerin sayısını göster
  const uncompletedTasks = tasks.filter(t => !t.completed);
  const uncompletedCount = uncompletedTasks.length;
  
  // Aktif indexteki görev tamamlanmış mı?
  // Listemiz zaten sıralı (tamamlanmamışlar üstte), bu yüzden activeIndex
  // eğer uncompletedCount'tan küçükse, o anki sırayı gösterir.
  const isViewingCompleted = activeIndex >= uncompletedCount;
  
  // Görev tamamlandığında
  const handleComplete = useCallback((taskId) => {
    // Scroll yapma! Çünkü liste yeniden sıralanacak ve sıradaki görev
    // otomatik olarak index 0'a (veya mevcut indexe) gelecek.
    // Sadece veri tabanını güncelle.
    onTaskComplete(taskId);
  }, [onTaskComplete]);

  const progressPercent = uncompletedCount > 0 
    ? Math.round(((Math.min(activeIndex + 1, uncompletedCount)) / uncompletedCount) * 100) 
    : 100;

  // Render
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ perspective: '1000px' }}>
      
      {/* Progress Bar (Uncompleted Focus) */}
      {uncompletedCount > 0 && !isViewingCompleted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 z-50">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Task Counter (Uncompleted Focus) */}
      {uncompletedCount > 0 && (
         <div className="absolute top-4 right-4 z-50 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 shadow-2xl">
           <span className="text-xs font-bold text-white/50 tracking-wider">
             {isViewingCompleted 
               ? <Check size={14} className="text-emerald-500" />
               : `${activeIndex + 1} / ${uncompletedCount}`
             }
           </span>
         </div>
      )}

      {/* Sticky Scroll Container */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-y-scroll no-scrollbar scroll-smooth snap-y snap-mandatory"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div 
          className="relative w-full"
          style={{ height: `${(tasks.length + 1) * 100}vh` }} // +1 Page for "All Caught Up"
        >
          {/* Ghost Snap Targets including final page */}
          {Array.from({ length: tasks.length + 1 }).map((_, i) => (
            <div 
              key={`snap-${i}`} 
              className="absolute w-full h-screen snap-start pointer-events-none" 
              style={{ top: `${i * 100}vh` }} 
            />
          ))}

          {/* Görünür Sahne (Sticky) */}
          <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
            
            {/* Empty State */}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center text-gray-500 space-y-6 animate-pulse">
                 <ListTodo size={48} className="text-gray-700" />
                 <p className="text-gray-600 font-medium">No tasks yet</p>
              </div>
            )}

            {/* Cards Stack */}
            <AnimatePresence mode="popLayout">
              {tasks.map((task, i) => (
                <StackedCard
                  key={task.id}
                  task={task}
                  index={i}
                  total={tasks.length} // Pass full length for calculation
                  scrollYProgress={scrollYProgress}
                  activeIndex={activeIndex}
                  onComplete={handleComplete}
                  onUndo={onUndo}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  t={t}
                  language={language}
                />
              ))}
            </AnimatePresence>

            {/* Scroll Hint */}
            {tasks.length > 1 && activeIndex === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{ delay: 2, duration: 2, repeat: Infinity }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20 pointer-events-none z-10"
              >
                <ChevronDown size={32} />
              </motion.div>
            )}

            {/* "All Caught Up" Message */}
            <motion.div 
               style={{ 
                 opacity: useTransform(scrollYProgress, [0.8, 1], [0, 1]),
                 scale: useTransform(scrollYProgress, [0.8, 1], [0.8, 1]),
                 zIndex: 0 
               }}
               className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            >
               <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                 <Sparkles className="text-emerald-500" size={32} />
               </div>
               <h3 className="text-emerald-500 font-bold text-xl tracking-widest uppercase">{t.allCaughtUp}</h3>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskFeed;
