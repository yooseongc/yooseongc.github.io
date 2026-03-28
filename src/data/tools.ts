export interface ToolMeta {
  name: string;
  slug: string;
  description: string;
  status: 'ready' | 'coming-soon';
}

export const tools: ToolMeta[] = [
  {
    name: 'Base64 Converter',
    slug: 'base64',
    description: 'Base64 인코딩/디코딩 변환기',
    status: 'coming-soon',
  },
  {
    name: 'JSON Tree Viewer',
    slug: 'json-viewer',
    description: 'JSON 데이터를 트리 구조로 시각화',
    status: 'coming-soon',
  },
  {
    name: 'Markdown Renderer',
    slug: 'markdown',
    description: 'Markdown 실시간 미리보기',
    status: 'coming-soon',
  },
  {
    name: '프로그래머 계산기',
    slug: 'programmer-calc',
    description: '진법 변환 및 비트 연산 계산기',
    status: 'coming-soon',
  },
  {
    name: '네트워크 주소 계산기',
    slug: 'network-calc',
    description: 'IP 서브넷 계산 및 주소 범위 확인',
    status: 'coming-soon',
  },
  {
    name: 'PEM Parser',
    slug: 'pem-parser',
    description: '인증서 PEM 파일 파싱 및 상세 정보 표시',
    status: 'coming-soon',
  },
  {
    name: 'JS Runner',
    slug: 'js-runner',
    description: '브라우저에서 JavaScript 코드 실행',
    status: 'coming-soon',
  },
  {
    name: 'REST API Tester',
    slug: 'api-tester',
    description: 'REST API 요청 전송 및 응답 확인',
    status: 'coming-soon',
  },
];
