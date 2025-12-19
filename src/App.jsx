import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  setDoc,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import TaskFeed from './components/TaskFeed.jsx';
import { ListTodo, LogIn, User, ArrowUpDown, Flame, Zap, Sparkles } from 'lucide-react';
import { locales } from './locales';

const AddTaskModal = lazy(() => import('./components/AddTaskModal'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const ConfirmationModal = lazy(() => import('./components/ConfirmationModal'));

/**
 * DoneSwipe - App Component
 * 
 * Psychological Design Principles Applied:
 * 1. Cognitive Load Theory: Focus Mode hides header when scrolling
 * 2. Zeigarnik Effect: Visible progress and streak indicators
 * 3. Variable Rewards: Level system, XP, dynamic celebrations
 * 4. Fitts' Law: Touch targets sized for thumb zone
 */
function App() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({ xp: 0, level: 1, streak: 0, lastTaskDate: null });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [sortOrder, setSortOrder] = useState('date');
  
  // Cognitive Load: Focus Mode - hide distractions when engaging with tasks
  const [isFocusMode, setIsFocusMode] = useState(false);

  const t = locales[language];

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Fetching & Real-time Sync
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    let unsubscribeTasks = () => {};
    let unsubscribeUser = () => {};

    const fetchData = async () => {
      try {
        // User Profile & Gamification
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const initialStats = { xp: 0, level: 1, streak: 0, lastTaskDate: null, email: user.email };
          await setDoc(userRef, initialStats);
          setUserStats(initialStats);
        } else {
          setUserStats(userSnap.data());
          unsubscribeUser = onSnapshot(userRef, (doc) => {
            if (doc.exists()) setUserStats(doc.data());
          });
        }

        // Tasks Subscription
        const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
        unsubscribeTasks = onSnapshot(q, (snapshot) => {
          const fetchedTasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTasks(fetchedTasks);
          setLoading(false);
        });

      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      unsubscribeTasks();
      unsubscribeUser();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success(t.loginSuccess, {
        icon: '🎉',
        style: { background: '#18181b', color: '#fff', borderRadius: '16px' }
      });
    } catch (error) {
      console.error(error);
      toast.error(t.loginFailed);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsSettingsOpen(false);
    toast.success(t.logoutSuccess);
  };

  const handleAddTask = async (newTask) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      toast.success(t.taskAdded, {
        icon: '✨',
        style: { background: '#18181b', color: '#fff', borderRadius: '16px' }
      });
    } catch (error) {
      console.error("Error adding task: ", error);
      toast.error("Failed to add task");
    }
  };

  // Zeigarnik Effect: Task Completion with Gamification
  const handleTaskComplete = async (taskId) => {
    if(!user) return;
    
    // Optimistic Update: Instantly update UI before server response
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === taskId ? { ...t, completed: true } : t
    ));

    try {
      // 1. Update Task
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { completed: true });

      // 2. Calculate Gamification (Variable Reward System)
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      let newStreak = userStats.streak || 0;
      let lastDate = userStats.lastTaskDate;

      // Streak calculation
      if (lastDate !== todayStr) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      const newXP = (userStats.xp || 0) + 10;
      const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

      // 3. Update User Stats
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        xp: newXP,
        level: newLevel,
        streak: newStreak,
        lastTaskDate: todayStr
      });

      // Variable Reward: Level Up Toast
      if (newLevel > (userStats.level || 1)) {
        toast.success(`${t.levelUp} ${t.level} ${newLevel}! 🚀`, { 
          duration: 5000, 
          style: { 
            background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', 
            color: '#fff', 
            fontWeight: 'bold',
            borderRadius: '16px',
            padding: '16px 24px'
          },
          icon: '🎮' 
        });
      }

    } catch (error) {
      console.error("Error completing task:", error);
      // Revert optimistic update on error
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, completed: false } : t
      ));
    }
  };

  const handleUndoComplete = async (taskId) => {
    if(!user) return;

    // Optimistic Update
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === taskId ? { ...t, completed: false } : t
    ));

    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { completed: false });
      
      // Deduct XP on undo
      const newXP = Math.max((userStats.xp || 0) - 10, 0);
      const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        xp: newXP,
        level: newLevel
      });

    } catch(e) {
      console.error(e);
      // Revert optimistic update
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, completed: true } : t
      ));
    }
  };

  const handleUpdateTask = async (updatedTask) => {
    if(!user) return;
    try {
      const taskRef = doc(db, 'tasks', updatedTask.id);
      const { id, ...data } = updatedTask;
      await updateDoc(taskRef, data);
      toast.success(t.updateTask, {
        icon: '✏️',
        style: { background: '#18181b', color: '#fff', borderRadius: '16px' }
      });
    } catch(e) {
      console.error(e);
      toast.error("Update failed");
    }
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
  };

  const requestDeleteTask = (taskId) => {
    setTaskToDelete(taskId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (taskToDelete && user) {
      try {
        await deleteDoc(doc(db, 'tasks', taskToDelete));
        setTaskToEdit(null); 
        setIsDeleteModalOpen(false);
        setTaskToDelete(null);
        toast.success(t.taskDeleted, {
          icon: '🗑️',
          style: { background: '#18181b', color: '#fff', borderRadius: '16px' }
        });
      } catch(e) {
        console.error("Delete failed", e);
        toast.error("Delete failed");
      }
    }
  };

  // Focus Mode Handler - Cognitive Load Reduction
  const handleFocusModeChange = useCallback((focused) => {
    setIsFocusMode(focused);
  }, []);

  // Derived stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;

  // Sorted Tasks - Robust Logic
  const sortedTasks = [...tasks].sort((a, b) => {
    // 1. Completed tasks always go to the bottom
    // Coerce to boolean to be safe
    const aCompleted = !!a.completed;
    const bCompleted = !!b.completed;
    
    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1;
    }
    
    // 2. Priority Sorting (if enabled)
    if (sortOrder === 'priority') {
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      const pA = priorityWeights[a.priority || 'medium'];
      const pB = priorityWeights[b.priority || 'medium'];
      if (pA !== pB) return pB - pA; // High priority first
    }
    
    // 3. Date Sorting (Newest first)
    // Fallback to string comparison for IDs if createdAt is missing
    const dateA = a.createdAt || '';
    const dateB = b.createdAt || '';
    return dateB.localeCompare(dateA);
  });

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden font-sans text-white relative selection:bg-indigo-500 selection:text-white mesh-gradient no-overscroll">
      
      {/* Background Ambient Effects (Desktop) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden hidden md:block">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-500/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-purple-500/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      </div>

      {/* Main Container */}
      <motion.div 
        className="relative z-10 w-full h-screen md:w-[420px] md:h-[880px] bg-black/50 backdrop-blur-2xl md:rounded-[4rem] md:border md:border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:scale-90 lg:scale-100 transition-transform duration-500"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Notch (Desktop Decoration) */}
        <div className="hidden md:block absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-[#050505] border-x border-b border-white/5 rounded-b-[1.5rem] z-50 shadow-xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-1.5 bg-[#111] rounded-full" />
          <div className="absolute top-1/2 right-4 -translate-y-1/2 w-2 h-2 bg-emerald-500/50 rounded-full animate-pulse" />
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 space-y-14 text-center"
            >
              {/* Logo & Branding */}
              <div className="space-y-6">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 blur-2xl opacity-50 rounded-3xl" />
                  <div className="relative w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30">
                    <ListTodo size={52} className="text-white" strokeWidth={2.5} />
                  </div>
                </motion.div>
                <div className="space-y-3">
                  <h1 className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400">
                    {t.appName}
                  </h1>
                  <p className="text-gray-400 font-medium max-w-[280px] mx-auto leading-relaxed">
                    {t.slogan}
                  </p>
                </div>
              </div>

              {/* Login Button - Fitts' Law: Large Touch Target */}
              <div className="w-full space-y-5 px-4">
                <motion.button 
                  onClick={handleLogin}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative w-full flex items-center justify-center space-x-3 bg-white text-black font-bold py-5 rounded-2xl overflow-hidden shadow-2xl shadow-white/10 touch-target"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <LogIn size={22} />
                  <span className="text-lg">{t.loginWithGoogle}</span>
                </motion.button>
                <p className="text-[10px] text-gray-500 max-w-[240px] mx-auto uppercase tracking-wide leading-relaxed">
                  {t.terms}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0 relative"
            >
              {/* Header - Cognitive Load: Fades on Focus Mode */}
              <motion.div 
                className="shrink-0 pt-4 pb-4 px-6 z-40 flex justify-between items-center bg-gradient-to-b from-black/95 via-black/50 to-transparent sticky top-0"
                animate={{
                  opacity: isFocusMode ? 0.3 : 1,
                  filter: isFocusMode ? 'blur(4px)' : 'blur(0px)',
                  y: isFocusMode ? -8 : 0
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="flex items-center space-x-3">
                  {/* App Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-40 rounded-xl" />
                    <div className="relative w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <ListTodo size={20} className="text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <h1 className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                      DoneSwipe
                    </h1>
                    
                    {/* Gamification Stats (Variable Rewards) */}
                    <div className="flex items-center gap-2 mt-0.5">
                      {/* Streak Badge */}
                      <div className="flex items-center gap-1 bg-orange-500/15 px-2 py-0.5 rounded-lg border border-orange-500/20">
                        <Flame size={10} className="text-orange-500 fill-orange-500 streak-fire" />
                        <span className="text-[9px] font-black text-orange-400">{userStats.streak || 0}</span>
                      </div>
                      
                      {/* Level Badge */}
                      <div className="flex items-center gap-1 bg-purple-500/15 px-2 py-0.5 rounded-lg border border-purple-500/20">
                        <Zap size={10} className="text-purple-400 fill-purple-400/50" />
                        <span className="text-[9px] font-black text-purple-400">LV {userStats.level || 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons - Fitts' Law: Adequate touch targets */}
                <div className="flex items-center space-x-2">
                  {/* Sort Toggle */}
                  <motion.button 
                    onClick={() => {
                      const newSort = sortOrder === 'date' ? 'priority' : 'date';
                      setSortOrder(newSort);
                      toast.success(newSort === 'date' ? t.sortByDate : t.sortByPriority, {
                         icon: newSort === 'date' ? '📅' : '🔥',
                         style: { background: '#18181b', color: '#fff', borderRadius: '16px' }
                      });
                    }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all touch-target ${
                      sortOrder === 'priority' 
                        ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' 
                        : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <ArrowUpDown size={18} />
                  </motion.button>

                  {/* Settings / Profile */}
                  <motion.button 
                    onClick={() => setIsSettingsOpen(true)}
                    whileTap={{ scale: 0.9 }}
                    className="w-11 h-11 rounded-xl bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all overflow-hidden touch-target"
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} className="text-zinc-400" />
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Feed Container - Main Interaction Zone */}
              <div className="flex-1 min-h-0 relative">
                <TaskFeed 
                  tasks={sortedTasks} 
                  onTaskComplete={handleTaskComplete} 
                  onUndo={handleUndoComplete}
                  onEdit={handleEditTask}
                  onDelete={requestDeleteTask}
                  t={t} 
                  language={language}
                  sortOrder={sortOrder}
                  onFocusModeChange={handleFocusModeChange}
                />
              </div>

            {/* Add/Edit Task Modal */}
            <Suspense fallback={null}>
              <AddTaskModal 
                onAddTask={handleAddTask} 
                onUpdateTask={handleUpdateTask}
                taskToEdit={taskToEdit}
                setTaskToEdit={setTaskToEdit}
                onDelete={requestDeleteTask}
                t={t} 
              />
            </Suspense>

              {/* Confirmation Modal */}
            <Suspense fallback={null}>
              <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteTask}
                message={t.deleteConfirmation}
                t={t}
              />
            </Suspense>

              {/* Visual Gradients for Depth */}
              <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black via-black/50 to-transparent pointer-events-none z-30" />
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none z-30" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Settings Dialog */}
      <Suspense fallback={null}>
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          user={user}
          userStats={userStats}
          language={language}
          setLanguage={setLanguage}
          logout={handleLogout}
          t={t}
          stats={{ total: totalTasks, completed: completedTasks }}
        />
      </Suspense>
    
      {/* Toast Container */}
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(24, 24, 27, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            color: '#fff',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
          }
        }}
      />
    </div>
  );
}

export default App;
