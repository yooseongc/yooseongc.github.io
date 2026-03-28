# Issues

## study-ui-lib AppLayout Astro 비호환

**문제**: AppLayout/Sidebar가 react-router-dom의 `<Outlet/>`, `NavLink`, `useLocation`에 의존하여 Astro SSG와 충돌

**해결**: AppLayout을 사용하지 않고 ThemeProvider + 개별 UI 컴포넌트만 재사용. 레이아웃은 Astro 네이티브로 구축하고 BlogShell React island로 인터랙티브 기능 제공

## react-router-dom peer dependency

**문제**: @study-ui/components가 react-router-dom을 peer dependency로 선언

**해결**: react-router-dom을 설치하되 BrowserRouter는 구성하지 않음. 블로그에서는 router 의존 컴포넌트를 사용하지 않음

## Tailwind CSS 4 클래스 스캔

**문제**: study-ui-lib 컴포넌트의 Tailwind 클래스가 빌드에 포함되지 않을 수 있음

**해결**: global.css에 `@source "../../lib/study-ui-lib/packages/ui/src/**/*.tsx"` 디렉티브 추가

## git submodule 로컬 경로 문제

**문제**: submodule URL이 로컬 파일 경로(`/Users/...`)로 등록되어 CI(GitHub Actions)에서 clone 실패

**해결**: `.gitmodules`의 URL을 `https://github.com/yooseongc/study-ui-lib.git`으로 변경

## Astro 6 Content Collections 변경

**문제**: Astro 6에서 `src/content/config.ts` 경로가 더 이상 지원되지 않음

**해결**: `src/content.config.ts`로 파일 이동, `glob` loader를 사용하는 새 API로 마이그레이션

## Tailwind CSS 4 @apply !important 미지원

**문제**: Tailwind CSS 4에서 `@apply` 내 `!important` 키워드 사용 시 빌드 에러

**해결**: BackToTop 색상 오버라이드를 `@apply` 대신 순수 CSS `!important`로 작성
