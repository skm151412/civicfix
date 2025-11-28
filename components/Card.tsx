import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', hoverEffect = false, onClick, ...rest }, ref) => (
    <motion.div
      whileHover={hoverEffect ? { y: -5, boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)' } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      ref={ref}
      className={`bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  )
);

Card.displayName = 'Card';

export default Card;