# Rules

## 스타일 가이드
- study-ui-lib의 `docs/STYLE.md` 전체 준수
- 폰트: Pretendard Variable (본문), JetBrains Mono (코드)
- 색상: oklch 기반 시맨틱 색상, Tailwind 유틸리티 사용
- 악센트: emerald 계열
- 다크 모드 기본

## 코드 컨벤션
- React 컴포넌트: PascalCase (`BlogShell.tsx`)
- 데이터 파일: camelCase (`profile.ts`)
- Astro 레이아웃/페이지: PascalCase (`BlogLayout.astro`)
- CSS: Tailwind 유틸리티 우선, 커스텀 클래스는 `global.css`에 정의

## 블로그 포스트
- `src/content/blog/` 디렉토리에 Markdown 파일
- frontmatter 필수 필드: title, date, tags
- 선택 필드: excerpt, draft

## 컴포넌트 사용
- study-ui-lib 컴포넌트 적극 활용 (ThemeProvider, Section, CardGrid, StatCard, CodeBlock 등)
- StudyProvider 의존 컴포넌트는 사용하지 않음 (AppLayout, Sidebar, TopicPage 등)

## 페이지 일관성
- 모든 페이지는 BlogLayout 사용
- 최대 너비: `max-w-5xl`
- 페이지 패딩: `px-6 py-12`
- 섹션 간격: `space-y-14` 또는 `space-y-12`
