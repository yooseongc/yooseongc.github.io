import { ThemeProvider } from '@study-ui/components';

interface ToolShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ToolShell({ title, description, children }: ToolShellProps) {
  return (
    <ThemeProvider>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <a
            href="/tools"
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            &larr; Tools
          </a>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        {children}
      </div>
    </ThemeProvider>
  );
}
