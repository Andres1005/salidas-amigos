import { cn } from "@/lib/cn";

type Tone = "primary" | "coral" | "sun" | "neutral";

const tones: Record<Tone, string> = {
  primary: "bg-primary-100 text-primary-800",
  coral: "bg-coral-100 text-coral-700",
  sun: "bg-sun-100 text-sun-800",
  neutral: "bg-ink/5 text-ink-soft",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
