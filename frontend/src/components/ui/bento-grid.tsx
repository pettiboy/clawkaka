import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 md:auto-rows-[22rem] lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

const accentStyles: Record<string, { border: string; iconBg: string; glow: string }> = {
  emerald: {
    border: "hover:border-emerald-300",
    iconBg: "bg-emerald-500/10 text-emerald-600 group-hover/bento:bg-emerald-500/15",
    glow: "hover:shadow-emerald-500/10",
  },
  violet: {
    border: "hover:border-violet-300",
    iconBg: "bg-violet-500/10 text-violet-600 group-hover/bento:bg-violet-500/15",
    glow: "hover:shadow-violet-500/10",
  },
  amber: {
    border: "hover:border-amber-300",
    iconBg: "bg-amber-500/10 text-amber-600 group-hover/bento:bg-amber-500/15",
    glow: "hover:shadow-amber-500/10",
  },
  rose: {
    border: "hover:border-rose-300",
    iconBg: "bg-rose-500/10 text-rose-600 group-hover/bento:bg-rose-500/15",
    glow: "hover:shadow-rose-500/10",
  },
  cyan: {
    border: "hover:border-cyan-300",
    iconBg: "bg-cyan-500/10 text-cyan-600 group-hover/bento:bg-cyan-500/15",
    glow: "hover:shadow-cyan-500/10",
  },
  indigo: {
    border: "hover:border-indigo-300",
    iconBg: "bg-indigo-500/10 text-indigo-600 group-hover/bento:bg-indigo-500/15",
    glow: "hover:shadow-indigo-500/10",
  },
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  accent = "emerald",
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: keyof typeof accentStyles;
}) => {
  const style = accentStyles[accent] ?? accentStyles.emerald;
  return (
    <div
      className={cn(
        "group/bento row-span-1 flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-0 shadow-sm transition-all duration-300 hover:shadow-xl",
        style.border,
        style.glow,
        className,
      )}
    >
      {header}
      <div className="flex flex-col gap-3 p-5 transition duration-200 group-hover/bento:translate-x-0.5">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
            style.iconBg,
          )}
        >
          {icon}
        </div>
        <h3 className="font-semibold tracking-tight text-zinc-900 text-lg">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-zinc-600">
          {description}
        </p>
      </div>
    </div>
  );
};
