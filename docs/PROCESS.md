# Process Log

## 2026-03-28: 블로그 신규 구축

### PR #1 - 블로그 신규 구축
- Astro 6 + React.js 프로젝트 초기화
- study-ui-lib git submodule 연동
- Tailwind CSS 4 + oklch 색상 체계 설정 (STYLE.md 준수)
- 3단 반응형 레이아웃 구축 (Sidebar | Content | TOC)
- ThemeProvider 기반 다크/라이트 모드
- 데이터 파일 구성 (profile, projects, works, studies)
- 페이지 구현: Home, Blog, Projects, About
- 블로그 콘텐츠 컬렉션 설정 + 초기 포스트
- 커스텀 컴포넌트: PostCard, ProjectCard, Timeline, TechBadge, TagBadge, Footer
- GitHub Actions 배포 워크플로우
- 문서화: README, PROCESS, ISSUES, RULES

### PR #2 - submodule URL 수정
- git submodule URL을 로컬 경로에서 GitHub remote URL로 변경
- CI 환경에서 빌드 실패 해결

### PR #3 - UI 개선
- Footer 컴포넌트 추가 (copyright, GitHub/Email 링크)
- 모바일 사이드바 슬라이드 애니메이션 (translate-x + opacity transition)
- 블로그 코드블록 다크모드 배경/테두리 스타일링
- BackToTop 버튼 색상 emerald 통일

### PR #4 - contents 원본 데이터 전체 반영 및 상세화
- PROJECTS.md 누락 프로젝트 전체 추가 (자료구조/알고리즘, 파이썬, DB, 웹, 데이터과학, 자바)
- STUDIES.md 각 토픽에 설명, 관련 기술 태그 추가
- About 페이지 Studies 섹션 카드 UI 리뉴얼

### 아키텍처 결정
- study-ui-lib의 AppLayout 미사용 (react-router-dom 의존성으로 Astro SSG 비호환)
- ThemeProvider + 개별 UI 컴포넌트만 재사용 (TableOfContents, BackToTop, Section 등)
- Astro 네이티브 레이아웃 + React island 패턴 (BlogShell)
- 악센트 컬러: emerald (기존 Hexo 블로그의 녹색 #42b983에 근접)
- 기본 테마: dark
