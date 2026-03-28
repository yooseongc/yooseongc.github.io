export interface ToolMeta {
  name: string;
  slug: string;
  description: string;
  status: 'ready' | 'coming-soon';
}

export interface ToolCategory {
  label: string;
  tools: ToolMeta[];
}

export const toolCategories: ToolCategory[] = [
  {
    label: '인코딩 / 변환',
    tools: [
      { name: 'Base64 Converter', slug: 'base64', description: 'Base64 인코딩/디코딩 변환기', status: 'ready' },
      { name: 'Unix Timestamp', slug: 'timestamp', description: 'Unix epoch ↔ 날짜 양방향 변환', status: 'coming-soon' },
      { name: 'UUID Generator', slug: 'uuid', description: 'UUID v4/v5/v7 생성 및 파싱', status: 'coming-soon' },
    ],
  },
  {
    label: '데이터 뷰어',
    tools: [
      { name: 'JSON Tree Viewer', slug: 'json-viewer', description: 'JSON 데이터를 트리 구조로 시각화', status: 'ready' },
      { name: 'Markdown Renderer', slug: 'markdown', description: 'Markdown 실시간 미리보기', status: 'ready' },
      { name: 'OpenAPI Viewer', slug: 'openapi', description: 'OpenAPI/Swagger 스펙 뷰어', status: 'coming-soon' },
      { name: 'Hex Viewer', slug: 'hex-viewer', description: '텍스트/파일의 hex dump 표시', status: 'coming-soon' },
    ],
  },
  {
    label: '네트워크 / 보안',
    tools: [
      { name: '네트워크 주소 계산기', slug: 'network-calc', description: 'IPv4/IPv6 서브넷 계산 및 주소 범위 확인', status: 'ready' },
      { name: 'PEM Parser', slug: 'pem-parser', description: '인증서 PEM 파일 파싱 및 상세 정보 표시', status: 'ready' },
      { name: 'JWT Decoder', slug: 'jwt', description: 'JWT 토큰 디코딩 및 검증', status: 'coming-soon' },
      { name: 'REST API Tester', slug: 'api-tester', description: 'REST API 요청 전송 및 응답 확인', status: 'ready' },
    ],
  },
  {
    label: '개발 도구',
    tools: [
      { name: '프로그래머 계산기', slug: 'programmer-calc', description: '진법 변환 및 비트 연산 계산기', status: 'ready' },
      { name: 'JS Runner', slug: 'js-runner', description: '브라우저에서 JavaScript 코드 실행', status: 'ready' },
      { name: 'Regex Tester', slug: 'regex', description: '정규식 테스트 및 매칭 하이라이트', status: 'coming-soon' },
      { name: 'Cron Parser', slug: 'cron', description: 'Cron 표현식 파싱 및 실행 스케줄 표시', status: 'coming-soon' },
      { name: 'C++ Demangler', slug: 'demangler', description: 'C++ mangled name 디맹글링 (Itanium/MSVC)', status: 'coming-soon' },
    ],
  },
];

// Flat list for backward compatibility
export const tools: ToolMeta[] = toolCategories.flatMap((c) => c.tools);
