export interface WorkEntry {
  period: string;
  title: string;
  description: string;
  techStack: string[];
}

export const works: WorkEntry[] = [
  {
    period: '2023 ~ 현재',
    title: '네트워크 보안 프로그래밍',
    description: 'SSL 가시화 엔진 개발, Linux Kernel/Network 프로그래밍',
    techStack: ['C++', 'Rust', 'Linux', 'Network', 'eBPF'],
  },
  {
    period: '2022',
    title: 'MLOps 플랫폼 개발',
    description: 'Kubernetes 기반 MLOps 플랫폼 구축',
    techStack: ['Kubernetes', 'Python', 'MLFlow', 'Docker'],
  },
  {
    period: '2017 ~ 2021',
    title: '기상/항공 데이터 분석 및 웹 응용',
    description: '기상 데이터 분석, 항공 운항/관제 시스템, 웹 기반 가시화',
    techStack: ['Java', 'Spring', 'Clojure', 'React', 'Angular', 'Fortran', 'WebGL'],
  },
];
