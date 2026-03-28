import { useRef } from 'react';
import { ThemeProvider, TableOfContents, BackToTop } from '@study-ui/components';
import { BlogSidebar } from './BlogSidebar';
import { Footer } from './Footer';

interface BlogShellProps {
  currentPath: string;
  children: React.ReactNode;
  showTOC?: boolean;
}

export function BlogShell({ currentPath, children, showTOC = true }: BlogShellProps) {
  const mainRef = useRef<HTMLDivElement>(null);

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden">
        <BlogSidebar currentPath={currentPath} />

        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto"
        >
          {children}
          <Footer />
        </main>

        {showTOC && <TableOfContents scrollRef={mainRef} />}
        <BackToTop scrollRef={mainRef} />
      </div>
    </ThemeProvider>
  );
}
