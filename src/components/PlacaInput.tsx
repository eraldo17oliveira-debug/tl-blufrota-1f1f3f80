import { Input } from "@/components/ui/input";
import { applyPlacaMask } from "@/lib/placaMask";

interface Props {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export default function PlacaInput({ value, onChange, className }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(applyPlacaMask(e.target.value));
  };

  return (
    <Input
      placeholder="PLACA (AAA-0A00)"
      value={value}
      onChange={handleChange}
      maxLength={8}
      className={`uppercase text-center font-mono-neon text-primary bg-input border-border/50 focus:border-primary h-12 text-base ${className || ""}`}
    />
  );
}
