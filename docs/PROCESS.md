# Process Log

## 2026-03-28: 블로그 신규 구축

### 완료
- Astro + React.js 프로젝트 초기화
- study-ui-lib git submodule 연동
- Tailwind CSS 4 + oklch 색상 체계 설정 (STYLE.md 준수)
- 3단 반응형 레이아웃 구축 (Sidebar | Content | TOC)
- ThemeProvider 기반 다크/라이트 모드
- 데이터 파일 구성 (profile, projects, works, studies)
- 페이지 구현: Home, Blog, Projects, About
- 블로그 콘텐츠 컬렉션 설정 + 초기 포스트
- 커스텀 컴포넌트: PostCard, ProjectCard, Timeline, TechBadge, TagBadge
- GitHub Actions 배포 워크플로우
- 문서화: README, PROCESS, ISSUES, RULES

### 아키텍처 결정
- study-ui-lib의 AppLayout 미사용 (react-router-dom 의존성으로 Astro SSG 비호환)
- ThemeProvider + 개별 UI 컴포넌트만 재사용
- Astro 네이티브 레이아웃 + React island 패턴
