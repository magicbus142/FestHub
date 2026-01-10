import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface AppLogoProps {
  className?: string;
  iconOnly?: boolean;
  onClick?: () => void;
}

export const AppLogo = ({ className, iconOnly = false, onClick }: AppLogoProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/');
    }
  };

  return (
    <motion.div
      className={cn("flex items-center gap-2.5 cursor-pointer group", className)}
      onClick={handleClick}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full group-hover:bg-primary/30 transition-colors" />
        <img
          src="/assets/images/logo.png"
          alt="FestHub Logo"
          className="w-9 h-9 md:w-10 md:h-10 rounded-xl shadow-lg shadow-primary/20 object-contain relative z-10 transition-transform group-hover:rotate-6"
        />
      </div>
      
      {!iconOnly && (
        <div className="flex flex-col">
          <span className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60 tracking-tight leading-none italic">
            FestHub
          </span>
          <span className="text-[10px] font-medium text-muted-foreground/80 tracking-widest uppercase mt-0.5 ml-0.5">
            Modern Festivals
          </span>
        </div>
      )}
    </motion.div>
  );
};
