// StatsCards - 4 glass cards (Total / Active / Completed / Overdue)
// with animated count-up on mount.

'use client';

import React, { useEffect, useState } from 'react';
import { Task } from '@/lib/types';

interface StatsCardsProps {
  tasks: Task[];
}

interface StatDef {
  key: string;
  label: string;
  value: number;
  accent: string;
  icon: React.ReactNode;
}

function useCountUp(target: number, durationMs = 600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent: string;
  icon: React.ReactNode;
}) {
  const display = useCountUp(value);
  return (
    <div className="glass animate-slideUp p-4 transition-all hover:-translate-y-0.5 hover:border-white/25 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        <span
          className={`grid h-8 w-8 place-items-center rounded-xl border ${accent}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {display}
      </p>
    </div>
  );
}

export function StatsCards({ tasks }: StatsCardsProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;
  const overdue = tasks.filter((t) => {
    if (t.completed || !t.due_date) return false;
    const d = new Date(t.due_date);
    if (Number.isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
  }).length;

  const stats: StatDef[] = [
    {
      key: 'total',
      label: 'Total',
      value: total,
      accent: 'border-white/15 bg-white/[0.05] text-slate-200',
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 11l3 3 8-8" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      ),
    },
    {
      key: 'active',
      label: 'Active',
      value: active,
      accent:
        'border-brand-400/30 bg-brand-500/15 text-brand-200 shadow-[0_0_18px_-6px_rgba(139,92,246,0.55)]',
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      ),
    },
    {
      key: 'completed',
      label: 'Completed',
      value: completed,
      accent:
        'border-emerald-400/30 bg-emerald-500/15 text-emerald-200 shadow-[0_0_18px_-6px_rgba(16,185,129,0.5)]',
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      key: 'overdue',
      label: 'Overdue',
      value: overdue,
      accent:
        'border-rose-400/30 bg-rose-500/15 text-rose-200 shadow-[0_0_18px_-6px_rgba(244,63,94,0.5)]',
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <circle cx="12" cy="16.5" r="0.5" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <StatCard
          key={s.key}
          label={s.label}
          value={s.value}
          accent={s.accent}
          icon={s.icon}
        />
      ))}
    </div>
  );
}
