import { AlertTriangle } from 'lucide-react';

interface PainPointBadgeProps {
  count: number;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  size?: 'sm' | 'md';
}

const SEVERITY_COLORS = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
};

export const PainPointBadge = ({
  count,
  severity = 'MEDIUM',
  size = 'sm',
}: PainPointBadgeProps) => {
  if (count === 0) return null;

  const sizeClasses = size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs';
  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <div
      className={`absolute -top-1 -right-1 ${sizeClasses} ${SEVERITY_COLORS[severity]} text-white rounded-full flex items-center justify-center font-bold shadow-md border-2 border-white`}
      title={`${count} pain point${count > 1 ? 's' : ''} (${severity})`}
    >
      {count > 9 ? '9+' : count}
    </div>
  );
};
