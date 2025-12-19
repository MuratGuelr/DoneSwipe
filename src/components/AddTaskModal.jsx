import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * AddTaskModal - Fitts' Law & Cognitive Load Optimized
 * 
 * Design Principles:
 * - Bottom Sheet pattern (Thumb Zone optimization)
 * - Large touch targets (min 48px)
 * - Progressive disclosure (show fields as needed)
 * - Spring physics for satisfying interactions
 */
const AddTaskModal = ({ onAddTask, onUpdateTask, taskToEdit, setTaskToEdit, onDelete, t }) => {
  // Helper to get local date string YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [isOpen, setIsOpen] = useState(false);
  const titleInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [priority, setPriority] = useState('medium'); 
  const [duration, setDuration] = useState('');
  const [dueDate, setDueDate] = useState(getTodayString());
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Haptic feedback - only works after user has clicked the FAB (which opens modal)
  const triggerHaptic = useCallback(() => {
    // Only trigger haptic when modal is open (user has already clicked)
    if (!window.navigator?.vibrate) return;
    try {
      window.navigator.vibrate(10);
    } catch (e) {
      // Silently fail
    }
  }, []);

  // Focus input with delay (prevents keyboard jump)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 350);
    }
  }, [isOpen]);

  // Fill form when editing
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      
      const standardCategories = ['Personal', 'Work', 'Health', 'Learning'];
      if (standardCategories.includes(taskToEdit.category)) {
        setCategory(taskToEdit.category);
        setIsCustom(false);
      } else {
        setIsCustom(true);
        setCustomCategory(taskToEdit.category || '');
      }
      
      setPriority(taskToEdit.priority || 'medium');
      setDuration(taskToEdit.duration || '');
      setDueDate(taskToEdit.dueDate || getTodayString());
      setShowAdvanced(true); // Show all fields when editing
      setIsOpen(true);
    } else {
      setDueDate(getTodayString());
    }
  }, [taskToEdit]);

  const closeModal = () => {
    triggerHaptic();
    setIsOpen(false);
    setTaskToEdit?.(null);
    
    // Reset form after animation
    setTimeout(() => {
      setTitle('');
      setDescription('');
      setDuration('');
      setDueDate(getTodayString());
      setCategory('Personal');
      setIsCustom(false);
      setShowAdvanced(false);
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    triggerHaptic();

    const taskData = {
      title,
      description,
      category: isCustom ? customCategory : category,
      priority,
      duration,
      dueDate,
      completed: taskToEdit ? taskToEdit.completed : false,
      createdAt: taskToEdit ? taskToEdit.createdAt : new Date().toISOString()
    };

    if (taskToEdit) {
      onUpdateTask({ ...taskData, id: taskToEdit.id });
    } else {
      onAddTask(taskData);
    }

    closeModal();
  };

  const handlePrioritySelect = (p) => {
    triggerHaptic();
    setPriority(p);
  };

  const handleCategorySelect = (cat) => {
    triggerHaptic();
    setCategory(cat);
    setIsCustom(false);
  };

  // Priority button styles with enhanced visual feedback
  const getPriorityStyle = (p) => {
    const styles = {
      low: {
        active: "bg-emerald-500/25 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20",
        inactive: "bg-white/5 border-transparent text-gray-500 hover:bg-emerald-500/10"
      },
      medium: {
        active: "bg-amber-500/25 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/20",
        inactive: "bg-white/5 border-transparent text-gray-500 hover:bg-amber-500/10"
      },
      high: {
        active: "bg-rose-500/25 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/20",
        inactive: "bg-white/5 border-transparent text-gray-500 hover:bg-rose-500/10"
      }
    };
    return priority === p ? styles[p].active : styles[p].inactive;
  };

  return (
    <>
      {/* FAB - Fitts' Law: Large Touch Target in Thumb Zone */}
      <motion.button
        className="fixed bottom-8 right-6 z-50 w-16 h-16 bg-gradient-to-tr from-indigo-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/40 text-white touch-target"
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.9, rotate: -5 }}
        onClick={() => {
          triggerHaptic();
          setIsOpen(true);
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Plus size={30} strokeWidth={3} />
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-50 -z-10" />
      </motion.button>

      {/* Modal / Bottom Sheet - Fitts' Law: Bottom positioned for thumb access */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
              onClick={closeModal}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ 
                type: "spring", 
                damping: 28, 
                stiffness: 350 
              }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-[#0f0f12]/98 backdrop-blur-2xl rounded-t-[2rem] p-6 pb-8 md:max-w-md md:mx-auto md:bottom-6 md:rounded-[2rem] border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              {/* Handle bar (Fitts' Law: Clear affordance) */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />

              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                    <Sparkles size={20} className="text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {taskToEdit ? t.editTask : t.newTask}
                  </h3>
                </div>
                <button 
                  onClick={closeModal}
                  className="w-10 h-10 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white flex items-center justify-center touch-target"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title Input - Cognitive Load: Most important first */}
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2 ml-1">
                    {t.title}
                  </label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.titlePlaceholder}
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-medium focus:border-indigo-500 focus:bg-white/8 focus:outline-none transition-all placeholder:text-gray-600 text-lg"
                  />
                </div>

                {/* Description - Optional, progressive disclosure */}
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.descriptionPlaceholder}
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-medium focus:border-indigo-500 focus:bg-white/8 focus:outline-none transition-all placeholder:text-gray-600 resize-none min-h-[80px]"
                  />
                </div>

                {/* Priority Selection - Fitts' Law: Large touch targets */}
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-3 ml-1">
                    {t.priority}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['low', 'medium', 'high'].map((p) => (
                      <motion.button
                        type="button"
                        key={p}
                        onClick={() => handlePrioritySelect(p)}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          "py-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border-2 touch-target",
                          getPriorityStyle(p)
                        )}
                      >
                        {t[p]}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Show More Toggle - Progressive Disclosure */}
                {!showAdvanced && (
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(true)}
                    className="w-full py-3 text-indigo-400 text-sm font-bold hover:text-indigo-300 transition-colors"
                  >
                    {t.moreOptions}
                  </button>
                )}

                {/* Advanced Options */}
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-5 overflow-hidden"
                    >
                      {/* Date & Duration Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2 ml-1">
                            {t.dueDate}
                          </label>
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            style={{ colorScheme: 'dark' }}
                            className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-4 py-3.5 text-white font-medium focus:border-indigo-500 focus:outline-none transition-all min-h-[52px] text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2 ml-1">
                            {t.duration}
                          </label>
                          <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="Min"
                            className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-4 py-3.5 text-white font-medium focus:border-indigo-500 focus:outline-none transition-all placeholder:text-gray-600 min-h-[52px] text-sm"
                          />
                        </div>
                      </div>

                      {/* Category Selection */}
                      <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-3 ml-1">
                          {t.category}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['Personal', 'Work', 'Health', 'Learning'].map((cat) => (
                            <motion.button
                              type="button"
                              key={cat}
                              onClick={() => handleCategorySelect(cat)}
                              whileTap={{ scale: 0.95 }}
                              className={cn(
                                "px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2 touch-target",
                                (category === cat && !isCustom)
                                  ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10" 
                                  : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10"
                              )}
                            >
                              {t.categories[cat] || cat}
                            </motion.button>
                          ))}
                          <motion.button
                            type="button"
                            onClick={() => {
                              triggerHaptic();
                              setIsCustom(true);
                            }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              "px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2 touch-target",
                              isCustom 
                                ? "bg-indigo-500/20 border-indigo-500 text-indigo-400" 
                                : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10"
                            )}
                          >
                            {t.custom}
                          </motion.button>
                        </div>
                        
                        <AnimatePresence>
                          {isCustom && (
                            <motion.input
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              type="text"
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              placeholder={t.enterCategory}
                              className="w-full mt-3 bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-3.5 text-white font-medium focus:border-indigo-500 focus:outline-none transition-all placeholder:text-gray-600"
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons - Fitts' Law: Bottom position, large targets */}
                <div className="pt-4 space-y-3">
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-4.5 rounded-2xl shadow-xl shadow-indigo-900/30 transition-all flex items-center justify-center gap-2 touch-target text-lg"
                  >
                    <Sparkles size={18} />
                    {taskToEdit ? t.updateTask : t.addTask}
                  </motion.button>

                  {/* Delete Button - Only in Edit Mode */}
                  {taskToEdit && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        triggerHaptic();
                        onDelete(taskToEdit.id);
                        closeModal();
                      }}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-4 rounded-2xl border-2 border-red-500/20 transition-all flex items-center justify-center gap-2 touch-target"
                    >
                      <Trash2 size={18} />
                      {t.deleteTask}
                    </motion.button>
                  )}
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AddTaskModal;
