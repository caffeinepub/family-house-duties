import React from 'react';

interface HeroHeaderProps {
  imageSrc: string;
  alt: string;
  title?: string;
  subtitle?: string;
}

export function HeroHeader({ imageSrc, alt, title, subtitle }: HeroHeaderProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl mb-6">
      <div className="relative h-48 md:h-56 lg:h-64">
        <img
          src={imageSrc}
          alt={alt}
          className="h-full w-full object-cover"
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Optional title and subtitle overlay */}
        {(title || subtitle) && (
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            {title && <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>}
            {subtitle && <p className="text-lg md:text-xl text-white/90">{subtitle}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
