import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [cursorState, setCursorState] = useState('default'); // 'default', 'hover', 'input', 'media'
  const [hoverType, setHoverType] = useState('default');     // 'default', 'link', 'input', 'media'
  const [isClicked, setIsClicked] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  
  // Custom springs optimized for smooth, satisfying physical lag
  const mouseX = useSpring(0, { stiffness: 350, damping: 24 });
  const mouseY = useSpring(0, { stiffness: 350, damping: 24 });

  const dotX = useSpring(0, { stiffness: 850, damping: 35 });
  const dotY = useSpring(0, { stiffness: 850, damping: 35 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!hasMoved) setHasMoved(true);
      mouseX.set(e.clientX - 16); // Center of 32px circle
      mouseY.set(e.clientY - 16);
      dotX.set(e.clientX - 4); // Center of 8px dot
      dotY.set(e.clientY - 4);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;
      
      const closestLink = target.closest('a') || target.closest('button') || (target.classList && target.classList.contains('magnetic-btn'));
      const closestInput = target.closest('input') || target.closest('textarea') || target.closest('select');
      const isMedia = target.closest('.group') || target.closest('.heatmap-cell') || target.closest('.timeline-item') || target.closest('.chart-bar') || target.closest('tr');

      if (closestLink) {
        setCursorState('hover');
        setHoverType('link');
      } else if (closestInput) {
        setCursorState('input');
        setHoverType('input');
      } else if (isMedia) {
        setCursorState('media');
        setHoverType('media');
      } else {
        setCursorState('default');
        setHoverType('default');
      }
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mouseX, mouseY, dotX, dotY, hasMoved]);

  // Don't render the custom cursor on touch / pointer-coarse devices (phones, tablets)
  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  if (isTouchDevice || !hasMoved) return null;


  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          body, a, button, select, input, [role="button"], textarea, .glass-panel, .magnetic-btn, .heatmap-cell, label {
            cursor: none !important;
          }
        }
      `}</style>
      
      {/* Center Precision Dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block rounded-full"
        style={{
          x: dotX,
          y: dotY,
          width: 8,
          height: 8,
          backgroundColor: '#00dbe7',
          boxShadow: '0 0 10px rgba(0, 219, 231, 0.8)',
        }}
        animate={{
          scale: isClicked 
            ? 1.4 
            : (cursorState === 'hover' 
                ? 0.3 
                : (cursorState === 'input' 
                    ? 0.5 
                    : 1)),
          backgroundColor: isClicked 
            ? '#D2FF00' 
            : (hoverType === 'media' ? '#D2FF00' : '#00dbe7'),
          boxShadow: isClicked 
            ? '0 0 12px #D2FF00' 
            : '0 0 10px rgba(0, 219, 231, 0.8)',
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      />
      
      {/* Outer Aesthetic Ring (Shape-Morphing) */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9998] hidden md:block"
        style={{
          x: mouseX,
          y: mouseY,
          width: 32,
          height: 32,
          border: '1px solid rgba(0, 219, 231, 0.4)',
        }}
        animate={{
          scale: isClicked 
            ? 0.75 
            : (cursorState === 'hover' 
                ? 1.6 
                : (cursorState === 'input' 
                    ? 0.5 
                    : (cursorState === 'media' ? 2.0 : 1))),
          backgroundColor: cursorState === 'hover' 
            ? 'rgba(0, 219, 231, 0.06)' 
            : (cursorState === 'media' ? 'rgba(210, 255, 0, 0.04)' : 'transparent'),
          borderColor: isClicked
            ? '#D2FF00'
            : (cursorState === 'hover'
                ? '#00dbe7'
                : (cursorState === 'input'
                    ? 'rgba(255, 255, 255, 0.6)'
                    : (cursorState === 'media' ? '#D2FF00' : 'rgba(0, 219, 231, 0.4)'))),
          borderRadius: cursorState === 'input' ? '4px' : '50%',
          borderWidth: cursorState === 'input' ? '2px' : '1px',
          boxShadow: isClicked 
            ? '0 0 25px #D2FF00' 
            : (cursorState === 'hover' 
                ? '0 0 15px rgba(0, 219, 231, 0.3)' 
                : (cursorState === 'media' ? '0 0 20px rgba(210, 255, 0, 0.3)' : 'none')),
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      />

      {/* Futuristic HUD Label Tag */}
      {cursorState !== 'default' && cursorState !== 'input' && (
        <motion.div
          className="pointer-events-none fixed top-0 left-0 z-[9999] hidden md:flex items-center justify-center terminal-text text-[7px] font-bold tracking-widest px-2 py-0.5 rounded border bg-[#060608]/90 backdrop-blur-md"
          style={{
            x: dotX,
            y: dotY,
            translateX: 24,
            translateY: 12,
            borderColor: hoverType === 'media' ? 'rgba(210,255,0,0.3)' : 'rgba(0,219,231,0.3)',
            color: hoverType === 'media' ? '#D2FF00' : '#00dbe7',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.1 }}
        >
          {hoverType === 'media' ? 'ANALYZE' : 'ENGAGE'}
        </motion.div>
      )}
    </>
  );
}
