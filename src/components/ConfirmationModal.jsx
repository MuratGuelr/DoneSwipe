import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle } from 'lucide-react';

/**
 * ConfirmationModal - Cognitive Load Optimized
 * 
 * Design Principles:
 * - Cognitive Load: Minimal UI, clear action
 * - Fitts' Law: Large action buttons in thumb zone
 * - Visual Clarity: Red = destructive, clear hierarchy
 */
const ConfirmationModal = ({ isOpen, onClose, onConfirm, message, t }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
            onClick={onClose}
          />

          {/* Modal Card - Centered for attention */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-sm px-4"
          >
            <div className="bg-[#0f0f12]/98 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
              
              {/* Warning Icon with Glow */}
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-red-500/30 blur-xl rounded-full" />
                <div className="relative w-20 h-20 bg-red-500/15 rounded-2xl flex items-center justify-center border border-red-500/30">
                  <Trash2 size={36} className="text-red-400" />
                </div>
              </motion.div>

              {/* Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h3 className="text-xl font-black text-white tracking-tight mb-2">
                  {t.deleteTask}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[260px]">
                  {message}
                </p>
              </motion.div>

              {/* Actions - Fitts' Law: Large Touch Targets */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3 w-full pt-2"
              >
                <motion.button
                  onClick={onClose}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-4 rounded-2xl bg-white/5 border-2 border-white/10 text-gray-300 font-bold hover:bg-white/10 transition-all touch-target"
                >
                  {t.cancel}
                </motion.button>
                <motion.button
                  onClick={onConfirm}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-xl shadow-red-900/40 transition-colors touch-target"
                >
                  {t.delete}
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
