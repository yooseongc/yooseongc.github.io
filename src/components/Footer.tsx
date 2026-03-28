export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-500">
        <span>&copy; {new Date().getFullYear()} yooseongc</span>
        <div className="flex gap-4">
          <a
            href="https://github.com/yooseongc"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            GitHub
          </a>
          <a
            href="mailto:choiys3574@naver.com"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Email
          </a>
          <span>Built with Astro</span>
        </div>
      </div>
    </footer>
  );
}
