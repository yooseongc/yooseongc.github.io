export interface StudyTopic {
  name: string;
  subtopics?: string[];
}

export interface StudyCategory {
  title: string;
  topics: StudyTopic[];
}

export const studies: StudyCategory[] = [
  {
    title: 'Computer Science',
    topics: [
      { name: 'Object-Oriented Programming, Design Pattern' },
      { name: '컴퓨터 구조' },
      { name: '자료구조 / 알고리즘' },
      { name: 'Data Science / Machine Learning' },
      { name: 'Linux Kernel, Network' },
      { name: '웹 보안 기술 (TLS, Certificates)' },
    ],
  },
  {
    title: 'Atmospheric Science',
    topics: [
      { name: '대기역학, 자료동화, 수치모델 및 수치해석' },
      { name: '기상 데이터 처리 (수치모델, 위성, 레이더)' },
    ],
  },
  {
    title: 'ETC',
    topics: [
      { name: 'Hadoop' },
      { name: 'MLOps' },
      { name: 'DevOps' },
    ],
  },
  {
    title: 'Web Related',
    topics: [
      {
        name: 'Web Backend',
        subtopics: ['RESTful API', 'Architecture', 'Database, SQL'],
      },
      {
        name: 'Web Frontend',
        subtopics: ['HTML/CSS/JavaScript ECMAScript5+', 'Web Visualization (D3, Three.js, WebGL)'],
      },
    ],
  },
  {
    title: 'Container 기반 가상화 기술',
    topics: [
      { name: 'Docker' },
      { name: 'Kubernetes' },
    ],
  },
];
