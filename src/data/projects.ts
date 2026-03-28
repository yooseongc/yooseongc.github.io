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
        name: 'coding-train',
        description: 'p5.js를 이용한 다양한 아이디어 가시화 (Daniel Shiffman 챌린지)',
        github: 'https://github.com/yooseongc/coding-train',
        demo: 'https://yooseongc.github.io/coding-train',
        tags: ['p5.js', 'Visualization'],
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
      {
        name: 'roulette',
        description: '3D 랜덤 룰렛 뽑기 (lazygyu/roulette fork)',
        github: 'https://github.com/yooseongc/roulette',
        demo: 'https://yooseongc.github.io/roulette',
        tags: ['3D', 'WebGL'],
      },
    ],
  },
  {
    title: 'Study',
    description: '언어 및 기술 학습 프로젝트',
    projects: [
      {
        name: 'nand2tetris',
        description: 'nand2tetris를 통한 컴퓨터 구조 학습',
        github: 'https://github.com/yooseongc/nand2tetris',
        tags: ['Computer Architecture'],
      },
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
        name: 'fast-api-study',
        description: 'FastAPI 학습',
        github: 'https://github.com/yooseongc/fast-api-study',
        tags: ['Python', 'FastAPI'],
      },
      {
        name: 'd3-in-action',
        description: 'D3.js 학습',
        github: 'https://github.com/yooseongc/d3-in-action',
        tags: ['D3', 'Visualization'],
      },
    ],
  },
];
