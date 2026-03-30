"use client";

import React, { useId } from "react";
import { motion } from "framer-motion";
import {
  Coffee,
  Coins,
  Hexagon,
  Home,
  Link2Off,
  Sparkles,
  TrainFront,
  Wifi,
} from "lucide-react";

function BadgeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="relative flex w-full flex-col items-center justify-center gap-4 rounded-xl bg-background p-4 shadow-sm"
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
    >
      {children}
    </motion.div>
  );
}

function BadgeTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string | null;
}) {
  return (
    <div className="text-center">
      <h3 className="text-sm font-semibold text-foreground sm:text-base">
        {title}
      </h3>
      {subtitle ? (
        <p className="text-xs font-semibold text-amber-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

function CoffeeBadge() {
  const coinVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
        repeat: Infinity,
        repeatDelay: 1.5,
      },
    }),
  } as const;

  return (
    <div className="relative h-24 w-24 sm:h-32 sm:w-32">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500 via-yellow-700 to-amber-800 shadow-md" />
      <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-stone-900">
        <div className="relative">
          <Coffee className="h-12 w-12 text-amber-200 sm:h-14 sm:w-14" strokeWidth={1.5} />
          <div className="absolute -top-7 left-1/2 flex w-full -translate-x-1/2 flex-col items-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                custom={i}
                variants={coinVariants}
                initial="hidden"
                animate="visible"
              >
                <Coins className="h-5 w-5 text-yellow-400" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CommuterBadge() {
  const clipId = useId();

  return (
    <div className="relative h-24 w-24 sm:h-32 sm:w-32">
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d="M0.5,0 C0.5,0,0.99,0.1,1,0.2 V0.55 C1,0.85,0.7,0.95,0.5,1 C0.3,0.95,0,0.85,0,0.55 V0.2 C0.01,0.1,0.5,0,0.5,0 Z" />
          </clipPath>
        </defs>
      </svg>

      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500 shadow-md"
        style={{ clipPath: `url(#${clipId})` }}
      />
      <div
        className="absolute inset-1.5 flex items-center justify-center bg-blue-700"
        style={{ clipPath: `url(#${clipId})` }}
      >
        <div className="relative flex items-center justify-center">
          <Link2Off
            className="absolute h-10 w-10 rotate-45 text-slate-200/80 sm:h-12 sm:w-12"
            strokeWidth={1.5}
          />
          <motion.div
            initial={{ x: -10 }}
            animate={{ x: 10 }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 0.5,
              ease: "easeInOut",
            }}
          >
            <TrainFront
              className="relative h-14 w-14 text-white sm:h-16 sm:w-16"
              strokeWidth={1.5}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function WifiBadge() {
  return (
    <div className="relative h-24 w-24 sm:h-32 sm:w-32">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300 via-slate-500 to-cyan-600 shadow-md" />
      <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-blue-950">
        <div className="relative">
          <Wifi className="h-14 w-14 text-cyan-300 sm:h-16 sm:w-16" strokeWidth={1.5} />
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute top-0 left-1/2"
              initial={{ y: -5, opacity: 0 }}
              animate={{ y: [-5, -22], opacity: [0, 1, 0] }}
              transition={{
                delay: i * 0.3,
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ x: `${(i - 1) * 22}px` }}
            >
              <motion.div className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HouseBadge() {
  const clipId = useId();

  return (
    <div className="relative h-24 w-24 sm:h-32 sm:w-32">
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d="M0.5,0 C0.5,0,0.99,0.1,1,0.2 V0.55 C1,0.85,0.7,0.95,0.5,1 C0.3,0.95,0,0.85,0,0.55 V0.2 C0.01,0.1,0.5,0,0.5,0 Z" />
          </clipPath>
        </defs>
      </svg>

      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600"
        style={{ clipPath: `url(#${clipId})` }}
        animate={{
          boxShadow: [
            "0 0 18px rgba(253, 224, 71, 0.35)",
            "0 0 26px rgba(253, 224, 71, 0.55)",
            "0 0 18px rgba(253, 224, 71, 0.35)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="absolute right-2 top-2 h-4 w-4 text-white/80" />
        <Sparkles className="absolute bottom-2 left-2 h-4 w-4 text-white/80" />
      </motion.div>

      <div
        className="absolute inset-1.5 flex items-center justify-center bg-slate-50"
        style={{ clipPath: `url(#${clipId})` }}
      >
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Hexagon
              className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-yellow-400 sm:h-20 sm:w-20"
              strokeWidth={1.5}
            />
          </motion.div>
          <Home className="relative h-12 w-12 text-amber-700 sm:h-14 sm:w-14" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

export function ConceptBadgesGrid() {
  const badges = [
    {
      id: 1,
      node: <CoffeeBadge />,
      title: "早餐咖啡自由 勳章 ☕️",
      subtitle: null,
    },
    {
      id: 2,
      node: <CommuterBadge />,
      title: "通勤解放者 徽章 🚇",
      subtitle: null,
    },
    {
      id: 3,
      node: <WifiBadge />,
      title: "網絡呼吸權 徽章 🌐",
      subtitle: null,
    },
    {
      id: 4,
      node: <HouseBadge />,
      title: "上蓋結界師 徽章 🏠",
      subtitle: "(高階徽章)",
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
      {badges.map((b) => (
        <BadgeWrapper key={b.id}>
          {b.node}
          <BadgeTitle title={b.title} subtitle={b.subtitle} />
        </BadgeWrapper>
      ))}
    </div>
  );
}

