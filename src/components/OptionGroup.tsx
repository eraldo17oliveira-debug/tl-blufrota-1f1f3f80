import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface Props {
  label: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  colorClass?: string;
}

export default function OptionGroup({ label, options, value, onChange, colorClass = "bg-primary text-primary-foreground" }: Props) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex gap-2">
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md border px-3 py-2.5 text-xs font-semibold transition-all",
              value === o.value
                ? cn(colorClass, "border-transparent shadow-sm")
                : "border-border bg-card text-card-foreground hover:bg-secondary"
            )}
          >
            {o.icon}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
