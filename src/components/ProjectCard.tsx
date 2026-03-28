import { TagBadge } from './TagBadge';

interface ProjectCardProps {
  name: string;
  description: string;
  github: string;
  demo?: string;
  tags?: string[];
}

export function ProjectCard({ name, description, github, demo, tags = [] }: ProjectCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5 flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{name}</h3>
      <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 flex-1">{description}</p>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-3 text-xs">
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          GitHub
        </a>
        {demo && (
          <a
            href={demo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors"
          >
            바로가기 &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
