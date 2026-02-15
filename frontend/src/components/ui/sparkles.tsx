"use client";
import React, { useId, useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface SparklesProps {
  id?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
  className?: string;
  particleSize?: number;
}

export const SparklesCore: React.FC<SparklesProps> = ({
  id,
  background = "transparent",
  minSize = 1,
  maxSize = 3,
  speed = 4,
  particleColor = "#10b981",
  particleDensity = 100,
  className,
}) => {
  const generatedId = useId();
  const effectId = id || generatedId;

  return (
    <div className={cn("relative h-full w-full", className)}>
      <svg className="h-full w-full" style={{ background }}>
        <defs>
          <radialGradient id={`gradient-${effectId}`}>
            <stop offset="0%" stopColor={particleColor} stopOpacity="1" />
            <stop offset="100%" stopColor={particleColor} stopOpacity="0" />
          </radialGradient>
        </defs>
        {[...Array(particleDensity)].map((_, index) => (
          <Particle
            key={index}
            gradientId={`gradient-${effectId}`}
            minSize={minSize}
            maxSize={maxSize}
            speed={speed}
          />
        ))}
      </svg>
    </div>
  );
};

const Particle: React.FC<{
  gradientId: string;
  minSize: number;
  maxSize: number;
  speed: number;
}> = ({ gradientId, minSize, maxSize, speed }) => {
  const [position, setPosition] = useState({
    x: Math.random() * 100,
    y: Math.random() * 100,
  });
  const [size] = useState(
    Math.random() * (maxSize - minSize) + minSize
  );
  const [opacity] = useState(Math.random() * 0.5 + 0.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition({
        x: Math.random() * 100,
        y: Math.random() * 100,
      });
    }, (Math.random() * 2000 + 1000) / speed);

    return () => clearInterval(interval);
  }, [speed]);

  return (
    <motion.circle
      cx={`${position.x}%`}
      cy={`${position.y}%`}
      r={size}
      fill={`url(#${gradientId})`}
      opacity={opacity}
      animate={{
        cx: `${position.x}%`,
        cy: `${position.y}%`,
      }}
      transition={{
        duration: Math.random() * 2 + 1,
        ease: "easeInOut",
      }}
    />
  );
};
