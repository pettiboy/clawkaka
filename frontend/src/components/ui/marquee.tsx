"use client";

import { cn } from "@/lib/utils";

interface MarqueeProps {
  className?: string;
  children: React.ReactNode;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  speed?: number;
}

export function Marquee({
  className,
  children,
  direction = "left",
  pauseOnHover = true,
  speed = 40,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]",
        className
      )}
    >
      <div
        className={cn(
          "flex shrink-0 gap-8 animate-marquee",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
          direction === "right" && "animate-marquee-right"
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
