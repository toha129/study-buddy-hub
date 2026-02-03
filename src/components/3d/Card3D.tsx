import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // Tilt intensity
  depth?: number; // Z-axis translation for content
}

const Card3D = ({ children, className = '', intensity = 15, depth = 40 }: Card3DProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Stiffer springs for "solid object" feel
  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${intensity}deg`, `-${intensity}deg`]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${intensity}deg`, `${intensity}deg`]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Set custom properties for CSS gradient effects
    cardRef.current.style.setProperty('--mouse-x', `${mouseX}px`);
    cardRef.current.style.setProperty('--mouse-y', `${mouseY}px`);

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={`relative ${className}`}
      whileHover={{ scale: 1.05, zIndex: 50 }} // "Lift" the item up
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Content Container - Pushed forward in Z-space */}
      <div
        style={{
          transform: isHovered ? `translateZ(${depth}px)` : 'translateZ(0px)',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
        }}
        className="h-full"
      >
        {children}
      </div>

    </motion.div>
  );
};

export default Card3D;
