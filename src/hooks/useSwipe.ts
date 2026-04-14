import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  /** True if a drag is in progress (use to suppress click navigation) */
  isSwiping: () => boolean;
}

/**
 * Lightweight swipe/drag hook for carousels.
 * Returns event handlers to spread on a container element.
 */
export function useSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 40,
): SwipeHandlers {
  const startX = useRef(0);
  const currentX = useRef(0);
  const dragging = useRef(false);
  const swiped = useRef(false);

  const handleStart = useCallback((x: number) => {
    startX.current = x;
    currentX.current = x;
    dragging.current = true;
    swiped.current = false;
  }, []);

  const handleMove = useCallback((x: number) => {
    if (!dragging.current) return;
    currentX.current = x;
  }, []);

  const handleEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    const diff = startX.current - currentX.current;
    if (Math.abs(diff) >= threshold) {
      swiped.current = true;
      if (diff > 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return {
    onTouchStart: useCallback((e: React.TouchEvent) => handleStart(e.touches[0].clientX), [handleStart]),
    onTouchMove: useCallback((e: React.TouchEvent) => handleMove(e.touches[0].clientX), [handleMove]),
    onTouchEnd: handleEnd,
    onMouseDown: useCallback((e: React.MouseEvent) => { e.preventDefault(); handleStart(e.clientX); }, [handleStart]),
    onMouseMove: useCallback((e: React.MouseEvent) => handleMove(e.clientX), [handleMove]),
    onMouseUp: handleEnd,
    onMouseLeave: useCallback(() => { if (dragging.current) handleEnd(); }, [handleEnd]),
    isSwiping: useCallback(() => swiped.current, []),
  };
}
