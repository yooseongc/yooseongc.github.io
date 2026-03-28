import { TechBadge } from './TechBadge';

interface TimelineEntry {
  period: string;
  title: string;
  description: string;
  techStack: string[];
}

interface TimelineProps {
  entries: TimelineEntry[];
}

export function Timeline({ entries }: TimelineProps) {
  return (
    <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-800 space-y-8">
      {entries.map((entry, i) => (
        <div key={i} className="relative">
          {/* Dot */}
          <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-950" />

          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {entry.period}
          </span>
          <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {entry.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {entry.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.techStack.map((tech) => (
              <TechBadge key={tech} name={tech} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
