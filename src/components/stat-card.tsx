interface StatCardProps {
  label: string;
  value: number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="flex flex-col items-start p-8 bg-white border border-black">
      <span className="text-sm font-medium text-zinc-600 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-6xl font-semibold text-black mt-2">
        {value.toLocaleString()}
      </span>
    </div>
  );
}
