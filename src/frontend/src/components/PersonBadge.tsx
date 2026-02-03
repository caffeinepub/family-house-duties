import { Badge } from '@/components/ui/badge';
import type { Principal } from '@icp-sdk/core/principal';

interface PersonBadgeProps {
  label: string;
  color?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm';
  className?: string;
}

export function PersonBadge({ label, color, variant = 'outline', size = 'default', className = '' }: PersonBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  
  return (
    <Badge variant={variant} className={`font-normal ${sizeClasses} ${className}`}>
      {color && (
        <span
          className="mr-1.5 inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </Badge>
  );
}
