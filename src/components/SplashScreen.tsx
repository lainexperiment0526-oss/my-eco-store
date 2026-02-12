import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound, sounds } from '@/utils/sounds';
import { Progress } from "@/components/ui/progress";

export interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Total loading time in milliseconds - slightly longer for smoother animation
    const totalLoadTime = 2800;
    // Update interval in milliseconds - more frequent updates for smoother progress
    const updateInterval = 16; // ~60fps
    // Calculate the number of updates needed
    const totalUpdates = totalLoadTime / updateInterval;
    // Calculate progress increment per update
    const progressIncrement = 100 / totalUpdates;
    
    // Start progress animation with easing
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        // Apply slight easing to make progress more natural
        const remaining = 100 - prevProgress;
        const increment = Math.min(progressIncrement * (0.5 + (remaining / 100)), remaining);
        
        if (prevProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(prevProgress + increment, 100);
      });
    }, updateInterval);
    
    // Complete the loading after the total time
    const timer = setTimeout(() => {
      // Audio removed - browser blocks autoplay without user interaction
      
      // Set exiting state first for smooth transition
      setIsExiting(true);
      
      // Small delay before transitioning
      setTimeout(() => {
        onComplete();
      }, 500);
    }, totalLoadTime);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait" onExitComplete={() => {}}>
      {!isExiting && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-sky-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          key="splash-screen"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="text-center flex flex-col items-center"
          >
            {/* Logo */}
            <motion.div
              className="mb-6 h-24 w-24 rounded-xl bg-white p-4 shadow-lg relative flex items-center justify-center"
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ 
                scale: [0.8, 1.05, 1],
                rotate: [-5, 2, 0] 
              }}
              transition={{ 
                delay: 0.3, 
                duration: 0.8, 
                ease: "easeOut",
                times: [0, 0.7, 1] 
              }}
            >
              <img 
                src="https://i.ibb.co/67KHWdv9/Add-a-subheading-2-removebg-preview.png"
                alt="Droplink Logo"
                className="h-full w-full object-contain"
              />
            </motion.div>
            
            {/* App Name */}
            <motion.h1 
              className="mb-2 font-poppins text-4xl font-bold text-white"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
            >
              Droplink
            </motion.h1>
            
            {/* Company Name */}
            <motion.p 
              className="text-sm text-white/80"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
            >
              by MRWAIN ORGANIZATION
            </motion.p>
            
            {/* Progress Percentage */}
            <motion.p
              className="mt-6 font-medium text-white/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {Math.round(progress)}%
            </motion.p>
            
            {/* Progress Bar */}
            <motion.div 
              className="mt-2 w-64 md:w-80"
              initial={{ opacity: 0, width: "60%" }}
              animate={{ opacity: 1, width: "100%" }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <div>
                <Progress 
                  value={progress} 
                  className="h-2 overflow-hidden"
                />
              </div>
            </motion.div>
            
            {/* Support Email */}
            <motion.p
              className="mt-8 text-xs text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Need help? Contact us at support@droplinkspace
            </motion.p>
            
            {/* Copyright */}
            <motion.p
              className="mt-4 text-xs text-white/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              © {new Date().getFullYear()} MRWAIN ORGANIZATION. All rights reserved.
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
