# yooseongc.github.io

개인 프로필, 기술 블로그, 프로젝트 소개를 위한 정적 블로그

## Tech Stack

- [Astro](https://astro.build/) + React.js 정적 사이트 생성
- [study-ui-lib](https://github.com/yooseongc/study-ui-lib) UI 컴포넌트 활용
- Tailwind CSS 4 스타일링
- Markdown 기반 콘텐츠 관리
- GitHub Actions -> GitHub Pages 배포

## Development

```bash
# submodule 초기화 (최초)
git submodule update --init --recursive

# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 빌드 결과 미리보기
pnpm preview
```

## Structure

```
src/
├── components/        # React 컴포넌트
│   └── tools/         # Web Tools 컴포넌트
├── content/
│   ├── blog/          # 기술 블로그 포스트 (Markdown)
│   └── journal/       # 일상 블로그 포스트 (Markdown)
├── data/              # 정적 데이터 (프로필, 프로젝트, 이력, 도구 등)
├── layouts/           # Astro 레이아웃
├── pages/
│   ├── blog/          # 기술 블로그 (/blog)
│   ├── journal/       # 일상 블로그 (/journal)
│   └── tools/         # Web Tools (/tools)
└── styles/            # 전역 스타일
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | 홈 (프로필, 최근 포스트, 도구, 프로젝트) |
| `/blog` | 기술 블로그 목록 |
| `/journal` | 일상 블로그 목록 |
| `/tools` | 웹 유틸리티 도구 모음 |
| `/projects` | 프로젝트 소개 |
| `/about` | 소개 |

## Adding a Blog Post

`src/content/blog/` 또는 `src/content/journal/` 디렉토리에 Markdown 파일을 추가합니다:

```markdown
---
title: '포스트 제목'
date: 2026-03-28
tags: ['tag1', 'tag2']
excerpt: '포스트 요약'
---

본문 내용
```
