export interface Project {
  name: string;
  description: string;
  github: string;
  demo?: string;
  tags: string[];
}

export interface ProjectCategory {
  title: string;
  description: string;
  projects: Project[];
}

export const projectCategories: ProjectCategory[] = [
  {
    title: 'Study Guide Pages',
    description: '학습 내용을 정리한 인터랙티브 가이드 페이지',
    projects: [
      {
        name: 'coding-train',
        description: 'p5.js를 이용한 다양한 아이디어 가시화 (Daniel Shiffman 챌린지)',
        github: 'https://github.com/yooseongc/coding-train',
        demo: 'https://yooseongc.github.io/coding-train',
        tags: ['p5.js', 'Visualization'],
      },
      {
        name: 'kernel-study',
        description: 'Linux Kernel 학습용 프로젝트',
        github: 'https://github.com/yooseongc/kernel-study',
        demo: 'https://yooseongc.github.io/kernel-study',
        tags: ['Linux', 'Kernel', 'OS'],
      },
      {
        name: 'network-study',
        description: '네트워크 학습용 프로젝트',
        github: 'https://github.com/yooseongc/network-study',
        demo: 'https://yooseongc.github.io/network-study',
        tags: ['Network', 'TCP/IP'],
      },
      {
        name: 'cert-study',
        description: 'TLS/인증서 학습용 프로젝트',
        github: 'https://github.com/yooseongc/cert-study',
        demo: 'https://yooseongc.github.io/cert-study',
        tags: ['TLS', 'Security'],
      },
      {
        name: 'study-ui-lib',
        description: 'Study 프로젝트를 위한 UI 라이브러리',
        github: 'https://github.com/yooseongc/study-ui-lib',
        demo: 'https://yooseongc.github.io/study-ui-lib',
        tags: ['React', 'UI', 'Tailwind'],
      },
    ],
  },
  {
    title: 'Games',
    description: '웹 기반 게임 프로젝트',
    projects: [
      {
        name: 'roulette',
        description: '3D 랜덤 룰렛 뽑기 (lazygyu/roulette fork)',
        github: 'https://github.com/yooseongc/roulette',
        demo: 'https://yooseongc.github.io/roulette',
        tags: ['3D', 'WebGL'],
      },
      {
        name: 'survive-game',
        description: 'AI 바이브 코딩을 이용한 뱀파이어 서바이벌 구현',
        github: 'https://github.com/yooseongc/survive-game',
        demo: 'https://yooseongc.github.io/survive-game',
        tags: ['Game', 'AI'],
      },
      {
        name: 'react-three',
        description: 'react-three-fiber를 이용한 마인크래프트 구현',
        github: 'https://github.com/yooseongc/react-three',
        demo: 'https://yooseongc.github.io/react-three',
        tags: ['Three.js', 'React', '3D'],
      },
    ],
  },
  {
    title: 'Study',
    description: '언어 및 기술 학습 프로젝트',
    projects: [
      // 컴퓨터 구조
      {
        name: 'nand2tetris',
        description: 'nand2tetris를 통한 컴퓨터 구조 학습',
        github: 'https://github.com/yooseongc/nand2tetris',
        tags: ['Computer Architecture'],
      },
      // C++ / Rust
      {
        name: 'cpp-study',
        description: '모던 C++ 학습',
        github: 'https://github.com/yooseongc/cpp-study',
        tags: ['C++'],
      },
      {
        name: 'rust-study',
        description: 'Rust 공식 가이드 학습',
        github: 'https://github.com/yooseongc/rust-get-started',
        tags: ['Rust'],
      },
      // 자료구조 / 알고리즘
      {
        name: 'algorithms',
        description: '알고리즘 학습',
        github: 'https://github.com/yooseongc/algorithms',
        tags: ['Algorithm'],
      },
      {
        name: 'data_structure',
        description: '자료구조 학습',
        github: 'https://github.com/yooseongc/data_structure',
        tags: ['Data Structure'],
      },
      {
        name: 'dpexample',
        description: '동적 프로그래밍 예제',
        github: 'https://github.com/yooseongc/dpexample',
        tags: ['Algorithm', 'DP'],
      },
      // 파이썬
      {
        name: 'inflearn-python-study',
        description: '인프런 파이썬 강의 학습',
        github: 'https://github.com/yooseongc/inflearn-python-study',
        tags: ['Python'],
      },
      {
        name: 'python-microservice-study',
        description: 'Python 마이크로서비스 학습',
        github: 'https://github.com/yooseongc/python-microservice-study',
        tags: ['Python', 'Microservice'],
      },
      {
        name: 'fast-api-study',
        description: 'FastAPI 학습',
        github: 'https://github.com/yooseongc/fast-api-study',
        tags: ['Python', 'FastAPI'],
      },
      {
        name: 'drf-study',
        description: 'Django REST Framework 학습',
        github: 'https://github.com/yooseongc/drf-study',
        tags: ['Python', 'Django'],
      },
      {
        name: 'ambassador-microservice',
        description: 'Ambassador 마이크로서비스 학습',
        github: 'https://github.com/yooseongc/ambassador-microservice',
        tags: ['Python', 'Microservice'],
      },
      // 데이터베이스
      {
        name: 'this-is-maria-db',
        description: 'MariaDB 학습',
        github: 'https://github.com/yooseongc/this-is-maria-db',
        tags: ['Database', 'MariaDB'],
      },
      // 웹
      {
        name: 'wds-study',
        description: 'Web Dev Simplified 강의 학습',
        github: 'https://github.com/yooseongc/wds-study',
        tags: ['Web', 'JavaScript'],
      },
      {
        name: 'react-website-smooth-scroll',
        description: 'React 웹사이트 스무스 스크롤 구현',
        github: 'https://github.com/yooseongc/react-website-smooth-scroll',
        tags: ['React', 'Web'],
      },
      {
        name: 'd3-in-action',
        description: 'D3.js 학습',
        github: 'https://github.com/yooseongc/d3-in-action',
        tags: ['D3', 'Visualization'],
      },
      {
        name: 'net-ninja-study',
        description: 'Net Ninja 강의 학습',
        github: 'https://github.com/yooseongc/net-ninja-study',
        tags: ['Web', 'JavaScript'],
      },
      {
        name: 'dcode-study',
        description: 'dcode 강의 학습',
        github: 'https://github.com/yooseongc/dcode-study',
        tags: ['Web', 'JavaScript'],
      },
      {
        name: 'simple-canvas-wave',
        description: 'Canvas 파동 애니메이션',
        github: 'https://github.com/yooseongc/simple-canvas-wave',
        tags: ['Canvas', 'Animation'],
      },
      // 데이터과학
      {
        name: 'data-science-study',
        description: '데이터 과학 학습',
        github: 'https://github.com/yooseongc/data-science-study',
        tags: ['Data Science', 'Python'],
      },
      // 자바
      {
        name: 'spring-board-project',
        description: 'Spring 게시판 프로젝트',
        github: 'https://github.com/yooseongc/spring-board-project',
        tags: ['Java', 'Spring'],
      },
      {
        name: 'gigabox-admin',
        description: 'Gigabox 관리자 페이지',
        github: 'https://github.com/yooseongc/gigabox-admin',
        tags: ['Java', 'Web'],
      },
      {
        name: 'gigabox',
        description: 'Gigabox 프로젝트',
        github: 'https://github.com/yooseongc/gigabox',
        tags: ['Java', 'Web'],
      },
      {
        name: 'shoppingmall',
        description: '쇼핑몰 프로젝트',
        github: 'https://github.com/yooseongc/shoppingmall',
        tags: ['Java', 'Web'],
      },
    ],
  },
];
