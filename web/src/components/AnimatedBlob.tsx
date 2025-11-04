import { motion } from 'framer-motion';

interface AnimatedBlobProps {
  color: 'violet' | 'cyan' | 'lime';
  size?: number;
  delay?: number;
  className?: string;
}

export function AnimatedBlob({ color, size = 400, delay = 0, className = '' }: AnimatedBlobProps) {
  const colorClasses = {
    violet: 'bg-violet/20',
    cyan: 'bg-cyan/20',
    lime: 'bg-primary/20',
  };

  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${colorClasses[color]} ${className}`}
      style={{
        width: size,
        height: size,
      }}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -50, 20, 0],
        scale: [1, 1.1, 0.9, 1],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
