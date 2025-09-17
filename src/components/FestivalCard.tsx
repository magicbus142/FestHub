import { Card } from '@/components/ui/card';
import type { Festival } from '@/lib/festivals';

interface FestivalCardProps {
  festival: Festival;
  onClick?: () => void;
}

export function FestivalCard({ festival, onClick }: FestivalCardProps) {
  return (
    <Card 
      className="relative overflow-hidden cursor-pointer hover:shadow-festive transition-all duration-300 hover:scale-105 aspect-[4/3] group"
      onClick={onClick}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {festival.background_image ? (
          <img 
            src={festival.background_image} 
            alt={festival.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full bg-gradient-festive"
            style={{
              backgroundColor: festival.background_color || 'hsl(var(--festival-orange))'
            }}
          />
        )}
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col justify-end text-white">
        <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">
          {festival.name}
        </h3>
        <p className="text-lg font-medium drop-shadow-md">
          {festival.year}
        </p>
      </div>
    </Card>
  );
}