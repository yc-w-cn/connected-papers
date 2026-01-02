import { Switch } from '@/components/switch';

interface StatCardProps {
  label: string;
  value: number;
  color?: string;
  switchChecked?: boolean;
  onSwitchChange?: (checked: boolean) => void;
}

export function StatCard({ label, value, color, switchChecked, onSwitchChange }: StatCardProps) {
  return (
    <div className="flex flex-col items-start p-8 bg-white border border-black relative">
      {onSwitchChange && (
        <div className="absolute top-8 right-8">
          <Switch checked={switchChecked ?? false} onChange={onSwitchChange} />
        </div>
      )}
      <div className="flex items-center gap-2">
        {color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
        <span className="text-sm font-medium text-zinc-600 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-6xl font-semibold text-black mt-2">
        {value.toLocaleString()}
      </span>
    </div>
  );
}
