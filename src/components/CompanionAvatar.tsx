import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SparkEmote } from '../types';
import { soundFX } from '../utils/audio';

interface CompanionAvatarProps {
  emote: SparkEmote;
  onClick?: () => UnitOrVoid;
  size?: number; // default 90px
  soundEnabled?: boolean;
  isDraggable?: boolean;
  className?: string;
}

type UnitOrVoid = void | Promise<void>;

export const CompanionAvatar: React.FC<CompanionAvatarProps> = ({
  emote,
  onClick,
  size = 90,
  soundEnabled = true,
  className = '',
}) => {
  const [isSquished, setIsSquished] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  // Eye blinking cycle every ~3.5 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 160);
    }, 3500);

    return () => clearInterval(blinkInterval);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSquished(true);
    if (soundEnabled) {
      soundFX.playSquish();
    }
    setTimeout(() => {
      setIsSquished(false);
    }, 180);

    if (onClick) {
      onClick();
    }
  };

  // Color mapping based on exact original Kotlin source
  const getBodyColor = (e: SparkEmote) => {
    switch (e) {
      case 'THINKING':
        return '#6750A4'; // Purple
      case 'SURPRISED':
        return '#E26D5C'; // Coral Pink/Orange
      case 'PROUD':
        return '#388E3C'; // Forest Green
      case 'CONFUSED':
        return '#E07A5F'; // Terracotta
      case 'SLEEPY':
        return '#4A4E69'; // Twilight Navy
      case 'HAPPY':
      default:
        return '#2B2D42'; // Dark Midnight Indigo
    }
  };

  const bodyColor = getBodyColor(emote);

  // Render eye expressions
  const renderEyes = () => {
    if (isBlinking || emote === 'SLEEPY') {
      return (
        <div className="flex justify-between items-center w-[58%] px-1">
          {/* Closed blinking / sleepy eyes */}
          <div className="w-3.5 h-[2.5px] bg-white rounded-full transition-all" />
          <div className="w-3.5 h-[2.5px] bg-white rounded-full transition-all" />
        </div>
      );
    }

    switch (emote) {
      case 'SURPRISED':
        return (
          <div className="flex justify-between items-center w-[58%] px-0.5">
            {/* Big round wide eyes */}
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
            </div>
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
            </div>
          </div>
        );

      case 'CONFUSED':
        return (
          <div className="flex justify-between items-center w-[58%] px-1">
            {/* Asymmetrical eyes */}
            <div className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-neutral-900 rounded-full -translate-y-0.5" />
            </div>
            <div className="w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center">
              <div className="w-0.5 h-0.5 bg-neutral-900 rounded-full" />
            </div>
          </div>
        );

      case 'PROUD':
        return (
          <div className="flex justify-between items-center w-[58%] px-1">
            {/* Confident curved eyes */}
            <div className="w-3.5 h-2 border-t-[3px] border-white rounded-t-full" />
            <div className="w-3.5 h-2 border-t-[3px] border-white rounded-t-full" />
          </div>
        );

      case 'THINKING':
        return (
          <div className="flex justify-between items-center w-[58%] px-1">
            {/* Looking upward right */}
            <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-neutral-900 rounded-full translate-x-0.5 -translate-y-0.5" />
            </div>
            <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-neutral-900 rounded-full translate-x-0.5 -translate-y-0.5" />
            </div>
          </div>
        );

      case 'HAPPY':
      default:
        return (
          <div className="flex justify-between items-center w-[58%] px-1">
            {/* Classic twin round white eyes */}
            <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
            <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
          </div>
        );
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative select-none cursor-pointer group inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title={`Spark Companion (${emote}) - Tap to squish & talk`}
    >
      {/* Floating subtle ambient glow */}
      <motion.div
        animate={{
          scale: emote === 'THINKING' ? [1, 1.15, 1] : [1, 1.05, 1],
          opacity: emote === 'THINKING' ? [0.4, 0.7, 0.4] : 0.25,
        }}
        transition={{
          repeat: Infinity,
          duration: emote === 'THINKING' ? 1.4 : 3,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 rounded-[28px] blur-md pointer-events-none"
        style={{ backgroundColor: bodyColor }}
      />

      {/* Main Avatar Body with Squish Physics */}
      <motion.div
        animate={{
          scaleY: isSquished ? 0.78 : 1.0,
          scaleX: isSquished ? 1.18 : 1.0,
          y: isSquished ? size * 0.1 : 0,
        }}
        transition={{
          type: 'spring',
          damping: 10,
          stiffness: 350,
          mass: 0.6,
        }}
        className="relative flex flex-col items-center justify-center shadow-xl border border-white/20 transition-colors duration-300"
        style={{
          width: size,
          height: size,
          backgroundColor: bodyColor,
          borderRadius: `${size * 0.44}px`,
        }}
      >
        {/* Subtle top glossy highlight reflection */}
        <div
          className="absolute top-1.5 left-3 right-3 h-[24%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none"
          style={{ borderRadius: `${size * 0.4}px ${size * 0.4}px 0 0` }}
        />

        {/* Eyes Container */}
        <div className="relative z-10 w-full flex justify-center items-center mt-[-4%]">
          {renderEyes()}
        </div>

        {/* Subtle cute mouth or blush for emotions */}
        <div className="relative z-10 mt-1 flex items-center justify-center h-2">
          {emote === 'HAPPY' && (
            <div className="w-2 h-1 border-b-[2px] border-white/80 rounded-b-full" />
          )}
          {emote === 'SURPRISED' && (
            <div className="w-1.5 h-1.5 bg-white/90 rounded-full" />
          )}
          {emote === 'PROUD' && (
            <div className="w-2.5 h-1 border-b-[2px] border-white/90 rounded-b-full translate-y-0.5" />
          )}
          {emote === 'CONFUSED' && (
            <div className="w-2 h-[2px] bg-white/70 rotate-[-12deg]" />
          )}
        </div>

        {/* Thinking or alert status indicator pip */}
        <AnimatePresence>
          {emote === 'THINKING' && (
            <motion.div
              initial={{ opacity: 0, scale: 0, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: -size * 0.58 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-900/90 border border-purple-400 text-[10px] text-purple-200 shadow-lg pointer-events-none whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              <span>Thinking...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
