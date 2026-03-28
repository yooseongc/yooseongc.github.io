export interface StudyTopic {
  name: string;
  description?: string;
  subtopics?: string[];
  relatedTech?: string[];
}

export interface StudyCategory {
  title: string;
  description?: string;
  topics: StudyTopic[];
}

export const studies: StudyCategory[] = [
  {
    title: 'Computer Science',
    description: '컴퓨터 과학 전반의 기초 이론과 시스템 프로그래밍',
    topics: [
      {
        name: 'Object-Oriented Programming, Design Pattern',
        description: '객체지향 설계 원칙과 GoF 디자인 패턴 학습',
        relatedTech: ['Java', 'C++'],
      },
      {
        name: '컴퓨터 구조',
        description: 'nand2tetris를 통한 하드웨어부터 소프트웨어까지의 컴퓨터 구조 이해',
        relatedTech: ['HDL', 'Assembly'],
      },
      {
        name: '자료구조 / 알고리즘',
        description: '기본 자료구조, 정렬/탐색/그래프 알고리즘, 동적 프로그래밍',
        relatedTech: ['C++', 'Python', 'Java'],
      },
      {
        name: 'Data Science / Machine Learning',
        description: '데이터 분석, 머신러닝 모델링, MLFlow 기반 실험 관리',
        relatedTech: ['Python', 'scipy', 'MLFlow'],
      },
      {
        name: 'Linux Kernel, Network',
        description: '프로세스 관리, 메모리, 파일시스템, 네트워크 스택, eBPF',
        relatedTech: ['C', 'Rust', 'eBPF'],
      },
      {
        name: '웹 보안 기술 (TLS, Certificates)',
        description: 'SSL/TLS 프로토콜, 인증서 체계, PKI, SSL 가시화 엔진 개발',
        relatedTech: ['C++', 'Rust', 'OpenSSL'],
      },
    ],
  },
  {
    title: 'Atmospheric Science',
    description: '대기과학 및 기상 데이터 분석 (이전 연구 분야)',
    topics: [
      {
        name: '대기역학, 자료동화, 수치모델 및 수치해석',
        description: '대기 운동 방정식, 수치예보 모델, 관측 자료 동화 기법',
        relatedTech: ['Fortran', 'NCL', 'Python'],
      },
      {
        name: '기상 데이터 처리 (수치모델, 위성, 레이더)',
        description: '기상 관측/예보 데이터 전처리, 가시화, 항공기상 응용',
        relatedTech: ['Python', 'GrADS', 'D3.js', 'WebGL'],
      },
    ],
  },
  {
    title: 'ETC',
    description: '빅데이터, ML 인프라, 운영 자동화',
    topics: [
      {
        name: 'Hadoop',
        description: 'HDFS, MapReduce 기반 분산 데이터 처리',
        relatedTech: ['Java', 'HDFS', 'MapReduce'],
      },
      {
        name: 'MLOps',
        description: 'ML 파이프라인 구축, 모델 서빙, 실험 추적',
        relatedTech: ['MLFlow', 'Kubernetes', 'Python'],
      },
      {
        name: 'DevOps',
        description: 'CI/CD, 인프라 자동화, 모니터링, Observability',
        relatedTech: ['GitHub Actions', 'Docker', 'Prometheus'],
      },
    ],
  },
  {
    title: 'Web Related',
    description: '웹 백엔드/프론트엔드 기술 전반',
    topics: [
      {
        name: 'Web Backend',
        description: '서버 아키텍처, API 설계, 데이터베이스',
        subtopics: ['RESTful API 설계 및 구현', 'Architecture (MVC, Microservice, Clean Architecture)', 'Database, SQL (MariaDB, PostgreSQL)'],
        relatedTech: ['Java', 'Spring', 'Python', 'FastAPI', 'Clojure'],
      },
      {
        name: 'Web Frontend',
        description: '프론트엔드 프레임워크와 데이터 가시화',
        subtopics: ['HTML/CSS/JavaScript ECMAScript5+', 'Web Visualization (D3.js, Three.js, WebGL, OSM)'],
        relatedTech: ['React', 'Angular', 'p5.js'],
      },
    ],
  },
  {
    title: 'Container 기반 가상화 기술',
    description: '컨테이너 오케스트레이션 및 인프라 구축',
    topics: [
      {
        name: 'Docker',
        description: '컨테이너 이미지 빌드, 멀티스테이지 빌드, Docker Compose',
      },
      {
        name: 'Kubernetes',
        description: 'Cluster 구축, Helm Chart, 서비스 배포, 스케일링',
        relatedTech: ['Helm', 'kubectl', 'k9s'],
      },
    ],
  },
];
