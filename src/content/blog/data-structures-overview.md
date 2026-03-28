---
title: '자료구조 총정리: 배열부터 그래프까지'
date: 2026-03-28
tags: ['Data Structure', 'Algorithm', 'CS Fundamentals']
excerpt: '배열, 연결 리스트, 스택, 큐, 해시맵, 트리, 그래프까지 주요 자료구조의 개념, 시간복잡도, 장단점을 실무 관점에서 총정리합니다.'
draft: false
---

## 왜 자료구조를 알아야 하는가

자료구조는 데이터를 효율적으로 저장하고 접근하기 위한 구조입니다. 같은 문제라도 어떤 자료구조를 선택하느냐에 따라 성능이 수천 배까지 차이날 수 있습니다.

백엔드 개발자에게 자료구조 지식은 특히 중요합니다. 데이터베이스 인덱스가 왜 B-Tree를 사용하는지, Redis의 Sorted Set이 내부적으로 Skip List를 쓰는 이유는 무엇인지, 네트워크 라우팅 테이블은 왜 Trie 구조인지를 이해하면, 시스템을 설계하고 성능을 최적화하는 데 실질적인 도움이 됩니다.

### 시간복잡도 표기

이 글에서는 Big-O 표기법을 사용합니다.

| 표기 | 의미 | 예시 |
|------|------|------|
| O(1) | 상수 시간 | 배열 인덱스 접근 |
| O(log n) | 로그 시간 | 이진 탐색 |
| O(n) | 선형 시간 | 배열 순차 탐색 |
| O(n log n) | 선형 로그 시간 | 효율적 정렬(Merge Sort) |
| O(n²) | 이차 시간 | 이중 반복문 |

---

## 1. 배열 (Array)

### 개념

배열은 **연속된 메모리 공간에 동일한 타입의 요소를 순서대로 저장**하는 자료구조입니다. 가장 기본적이면서도 가장 중요한 자료구조입니다.

### 시간복잡도

| 연산 | 복잡도 | 설명 |
|------|--------|------|
| 인덱스 접근 | O(1) | 시작 주소 + (인덱스 x 요소 크기) |
| 탐색 | O(n) | 최악의 경우 전체 순회 |
| 맨 뒤 삽입 | O(1)* | 동적 배열의 경우 amortized O(1) |
| 중간 삽입 | O(n) | 뒤의 요소를 모두 이동 |
| 중간 삭제 | O(n) | 뒤의 요소를 모두 이동 |

### 코드 예제

```java
// 정적 배열
int[] fixedArray = new int[100];

// 동적 배열 (Java ArrayList)
List<String> dynamicArray = new ArrayList<>();
dynamicArray.add("hello");      // O(1) amortized
dynamicArray.get(0);            // O(1)
dynamicArray.add(0, "world");   // O(n) - 뒤의 요소 전부 이동
dynamicArray.remove(0);         // O(n) - 앞으로 당기기
```

```python
# Python의 list는 동적 배열
arr = [1, 2, 3, 4, 5]

arr.append(6)       # O(1) amortized - 맨 뒤에 추가
arr[2]              # O(1) - 인덱스 접근
arr.insert(0, 0)    # O(n) - 맨 앞에 삽입 (전체 이동)
arr.pop()           # O(1) - 맨 뒤 제거
arr.pop(0)          # O(n) - 맨 앞 제거 (전체 이동)
```

### 장단점

- **장점**: 인덱스 접근이 O(1), 캐시 친화적(연속 메모리), 구현이 단순
- **단점**: 크기 고정(정적 배열), 중간 삽입/삭제가 O(n)

### 실무 활용

- 데이터 크기가 예측 가능하고, 랜덤 접근이 빈번한 경우
- 버퍼(네트워크 패킷 버퍼, 파일 I/O 버퍼)
- 행렬 연산, 이미지 처리

---

## 2. 연결 리스트 (Linked List)

### 개념

각 노드가 **데이터와 다음 노드에 대한 참조(포인터)**를 가지는 자료구조입니다. 메모리상에 연속적으로 배치되지 않으며, 포인터로 연결됩니다.

### 종류

- **단일 연결 리스트**: 각 노드가 다음 노드만 참조
- **이중 연결 리스트**: 각 노드가 이전/다음 노드 모두 참조
- **원형 연결 리스트**: 마지막 노드가 첫 번째 노드를 참조

### 시간복잡도

| 연산 | 복잡도 | 설명 |
|------|--------|------|
| 인덱스 접근 | O(n) | 처음부터 순회 필요 |
| 맨 앞 삽입/삭제 | O(1) | 포인터만 변경 |
| 맨 뒤 삽입/삭제 | O(1)* | 이중 연결 리스트에서 tail 포인터가 있는 경우 |
| 중간 삽입/삭제 | O(1)** | 위치를 이미 알고 있는 경우. 위치 탐색은 O(n) |
| 탐색 | O(n) | 처음부터 순회 |

### 코드 예제

```java
// Java LinkedList는 이중 연결 리스트
LinkedList<String> list = new LinkedList<>();
list.addFirst("A");    // O(1)
list.addLast("C");     // O(1)
list.add(1, "B");      // O(n) - 위치 탐색 후 O(1) 삽입

// 반복자를 사용하면 중간 삽입/삭제가 O(1)
ListIterator<String> it = list.listIterator();
while (it.hasNext()) {
    String val = it.next();
    if (val.equals("B")) {
        it.remove();   // O(1) - 이미 위치를 알고 있으므로
        it.add("B2");  // O(1)
    }
}
```

```python
# Python에는 내장 LinkedList가 없으므로 직접 구현
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None
        self.prev = None

class DoublyLinkedList:
    def __init__(self):
        self.head = None
        self.tail = None
        self.size = 0

    def append(self, data):
        new_node = Node(data)
        if self.tail is None:
            self.head = self.tail = new_node
        else:
            new_node.prev = self.tail
            self.tail.next = new_node
            self.tail = new_node
        self.size += 1

    def prepend(self, data):
        new_node = Node(data)
        if self.head is None:
            self.head = self.tail = new_node
        else:
            new_node.next = self.head
            self.head.prev = new_node
            self.head = new_node
        self.size += 1

    def delete_node(self, node):
        """이미 노드의 참조를 알고 있을 때 O(1) 삭제"""
        if node.prev:
            node.prev.next = node.next
        else:
            self.head = node.next
        if node.next:
            node.next.prev = node.prev
        else:
            self.tail = node.prev
        self.size -= 1
```

### 장단점

- **장점**: 삽입/삭제가 O(1) (위치를 알고 있을 때), 크기가 동적, 메모리 낭비 없음
- **단점**: 랜덤 접근 불가(O(n)), 포인터 추가 메모리 필요, 캐시 비친화적

### 실무 활용

- LRU 캐시 구현 (HashMap + 이중 연결 리스트)
- OS의 프로세스 스케줄링 큐
- 메모리 할당기의 free list

---

## 3. 스택 (Stack)

### 개념

**후입선출(LIFO, Last In First Out)** 원칙을 따르는 자료구조입니다. 마지막에 넣은 요소가 가장 먼저 나옵니다.

### 시간복잡도

| 연산 | 복잡도 |
|------|--------|
| push (삽입) | O(1) |
| pop (제거) | O(1) |
| peek (확인) | O(1) |

### 코드 예제

```java
// Java의 Deque를 스택으로 사용 (Stack 클래스보다 권장)
Deque<String> stack = new ArrayDeque<>();
stack.push("A");
stack.push("B");
stack.push("C");

stack.peek();  // "C" (제거하지 않고 확인)
stack.pop();   // "C"
stack.pop();   // "B"
```

```python
# Python의 list를 스택으로 사용
stack = []
stack.append("A")  # push
stack.append("B")
stack.append("C")

stack[-1]     # "C" (peek)
stack.pop()   # "C"
stack.pop()   # "B"

# collections.deque를 사용하면 스레드 안전
from collections import deque
stack = deque()
stack.append("A")
stack.pop()  # "A"
```

### 장단점

- **장점**: 구현이 단순, 모든 연산이 O(1)
- **단점**: 중간 요소 접근 불가, 크기가 제한적일 수 있음

### 실무 활용

- 함수 호출 스택 (Call Stack)
- 괄호 짝 맞추기, 수식 계산 (후위 표기법)
- 브라우저 뒤로가기/앞으로가기
- DFS(깊이 우선 탐색) 구현
- Undo/Redo 기능

---

## 4. 큐 (Queue)

### 개념

**선입선출(FIFO, First In First Out)** 원칙을 따르는 자료구조입니다. 먼저 넣은 요소가 먼저 나옵니다.

### 변형

- **일반 큐**: 기본 FIFO
- **우선순위 큐 (Priority Queue)**: 우선순위가 높은 요소가 먼저 나옴 (내부적으로 힙 사용)
- **덱 (Deque)**: 양쪽 끝에서 삽입/삭제 가능

### 시간복잡도

| 연산 | 일반 큐 | 우선순위 큐 |
|------|--------|------------|
| enqueue (삽입) | O(1) | O(log n) |
| dequeue (제거) | O(1) | O(log n) |
| peek (확인) | O(1) | O(1) |

### 코드 예제

```java
// 일반 큐
Queue<String> queue = new LinkedList<>();
queue.offer("A");  // enqueue
queue.offer("B");
queue.offer("C");

queue.peek();    // "A" (확인)
queue.poll();    // "A" (제거)

// 우선순위 큐
PriorityQueue<Task> pq = new PriorityQueue<>(
    Comparator.comparingInt(Task::getPriority)
);
pq.offer(new Task("백업", 3));       // 낮은 우선순위
pq.offer(new Task("장애 대응", 1));   // 높은 우선순위
pq.offer(new Task("리포트", 2));

pq.poll();  // "장애 대응" (우선순위 1이 먼저)
pq.poll();  // "리포트"     (우선순위 2)
pq.poll();  // "백업"       (우선순위 3)
```

```python
from collections import deque
import heapq

# 일반 큐: deque 사용
queue = deque()
queue.append("A")     # enqueue (오른쪽)
queue.append("B")
queue.popleft()       # dequeue (왼쪽) -> "A"

# 우선순위 큐: heapq 사용 (min-heap)
tasks = []
heapq.heappush(tasks, (3, "백업"))
heapq.heappush(tasks, (1, "장애 대응"))
heapq.heappush(tasks, (2, "리포트"))

heapq.heappop(tasks)  # (1, "장애 대응")
heapq.heappop(tasks)  # (2, "리포트")
```

### 장단점

- **장점**: FIFO 보장, 공정한 처리 순서
- **단점**: 중간 요소 접근 불가

### 실무 활용

- 메시지 큐(Kafka, RabbitMQ의 기본 원리)
- 작업 스케줄링 (BFS, 프린터 큐)
- 요청 처리 대기열 (웹 서버의 요청 큐)
- 이벤트 루프 (Node.js의 이벤트 큐)
- 네트워크 패킷 버퍼

---

## 5. 해시맵 (HashMap)

### 개념

**키-값(key-value) 쌍을 저장**하며, 해시 함수를 사용하여 키를 배열의 인덱스로 변환합니다. 이를 통해 평균적으로 O(1) 시간에 데이터를 검색할 수 있습니다.

### 해시 충돌 해결 방법

- **체이닝 (Chaining)**: 같은 버킷에 연결 리스트로 저장 (Java HashMap이 사용)
- **개방 주소법 (Open Addressing)**: 다른 빈 버킷을 찾아 저장 (Python dict이 사용)

### 시간복잡도

| 연산 | 평균 | 최악 |
|------|------|------|
| 검색 | O(1) | O(n) |
| 삽입 | O(1) | O(n) |
| 삭제 | O(1) | O(n) |

최악의 경우는 모든 키의 해시값이 동일하여 하나의 버킷에 몰리는 경우입니다. Java 8 이후 HashMap은 버킷 내 요소가 8개를 초과하면 연결 리스트를 Red-Black Tree로 변환하여 최악을 O(log n)으로 개선합니다.

### 코드 예제

```java
// Java HashMap
Map<String, Integer> portMap = new HashMap<>();
portMap.put("HTTP", 80);
portMap.put("HTTPS", 443);
portMap.put("SSH", 22);
portMap.put("DNS", 53);

portMap.get("SSH");               // 22, O(1)
portMap.containsKey("FTP");       // false, O(1)
portMap.getOrDefault("FTP", -1);  // -1

// 빈도수 세기 패턴
Map<String, Integer> wordCount = new HashMap<>();
for (String word : words) {
    wordCount.merge(word, 1, Integer::sum);
}

// Java ConcurrentHashMap: 멀티스레드 환경에서 안전
Map<String, Session> sessions = new ConcurrentHashMap<>();
```

```python
# Python dict (해시 테이블 기반)
port_map = {
    "HTTP": 80,
    "HTTPS": 443,
    "SSH": 22,
    "DNS": 53,
}

port_map["SSH"]              # 22, O(1)
port_map.get("FTP", -1)     # -1 (기본값)
"FTP" in port_map            # False, O(1)

# Counter를 사용한 빈도수 세기
from collections import Counter
word_count = Counter(words)
word_count.most_common(10)   # 상위 10개

# defaultdict: 키가 없을 때 기본값 자동 생성
from collections import defaultdict
graph = defaultdict(list)
graph["A"].append("B")
graph["A"].append("C")
```

### 장단점

- **장점**: 평균 O(1) 검색/삽입/삭제, 키-값 매핑에 최적
- **단점**: 순서 보장 없음(Java LinkedHashMap, Python 3.7+ dict은 삽입 순서 보장), 해시 함수 품질에 의존, 메모리 오버헤드

### 실무 활용

- 캐시 (in-memory cache, Redis의 핵심 자료구조)
- 데이터베이스 인덱스 (해시 인덱스)
- HTTP 헤더, 설정 파일 파싱
- 라우팅 테이블 (URL -> 핸들러 매핑)
- 중복 검사, 집합 연산

---

## 6. 트리 (Tree)

### 개념

**노드와 간선으로 구성된 계층적 자료구조**입니다. 하나의 루트 노드에서 시작하여 자식 노드들로 분기합니다. 사이클이 없는 연결 그래프입니다.

### 주요 종류

#### 이진 탐색 트리 (Binary Search Tree, BST)

각 노드의 왼쪽 서브트리에는 더 작은 값, 오른쪽 서브트리에는 더 큰 값이 위치합니다.

```
        8
       / \
      3   10
     / \    \
    1   6    14
       / \   /
      4   7 13
```

#### 균형 이진 탐색 트리

BST의 최악의 경우(한쪽으로 치우친 경우) O(n)을 방지하기 위해, 트리 높이를 O(log n)으로 유지하는 자료구조입니다.

- **AVL Tree**: 모든 노드에서 좌우 서브트리 높이 차이가 1 이하
- **Red-Black Tree**: 색상 규칙으로 균형 유지 (Java TreeMap, C++ std::map의 내부 구현)

#### B-Tree / B+ Tree

다수의 키를 하나의 노드에 저장하며, 디스크 기반 자료구조에 최적화되어 있습니다. **데이터베이스 인덱스의 표준 자료구조**입니다.

```
B+ Tree의 내부 구조 (차수 3):

         [10, 20]
        /    |    \
   [1,5]  [12,15]  [25,30]
    ↓↓      ↓↓       ↓↓
   데이터   데이터   데이터
```

#### 힙 (Heap)

완전 이진 트리에서 부모가 항상 자식보다 크거나(최대 힙) 작은(최소 힙) 성질을 유지합니다.

### 시간복잡도

| 연산 | BST (평균) | BST (최악) | 균형 BST | B-Tree |
|------|-----------|-----------|---------|--------|
| 검색 | O(log n) | O(n) | O(log n) | O(log n) |
| 삽입 | O(log n) | O(n) | O(log n) | O(log n) |
| 삭제 | O(log n) | O(n) | O(log n) | O(log n) |

### 코드 예제

```java
// Java TreeMap: Red-Black Tree 기반
TreeMap<String, Integer> sortedMap = new TreeMap<>();
sortedMap.put("charlie", 3);
sortedMap.put("alpha", 1);
sortedMap.put("bravo", 2);

sortedMap.firstKey();                // "alpha" - 최소 키
sortedMap.lastKey();                 // "charlie" - 최대 키
sortedMap.subMap("alpha", "charlie"); // 범위 검색

// PriorityQueue: 내부적으로 최소 힙
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5);
minHeap.offer(1);
minHeap.offer(3);
minHeap.poll();  // 1 (최솟값)
minHeap.poll();  // 3
```

```python
# 이진 탐색 트리 직접 구현
class TreeNode:
    def __init__(self, key, value=None):
        self.key = key
        self.value = value
        self.left = None
        self.right = None

class BST:
    def __init__(self):
        self.root = None

    def insert(self, key, value=None):
        self.root = self._insert(self.root, key, value)

    def _insert(self, node, key, value):
        if node is None:
            return TreeNode(key, value)
        if key < node.key:
            node.left = self._insert(node.left, key, value)
        elif key > node.key:
            node.right = self._insert(node.right, key, value)
        else:
            node.value = value  # 중복 키: 값 갱신
        return node

    def search(self, key):
        node = self.root
        while node:
            if key == node.key:
                return node.value
            elif key < node.key:
                node = node.left
            else:
                node = node.right
        return None

    def inorder(self):
        """중위 순회: 정렬된 순서로 반환"""
        result = []
        self._inorder(self.root, result)
        return result

    def _inorder(self, node, result):
        if node:
            self._inorder(node.left, result)
            result.append((node.key, node.value))
            self._inorder(node.right, result)
```

### 장단점

- **장점**: 계층적 데이터 표현에 적합, 정렬된 데이터 유지, 범위 검색 효율적
- **단점**: 구현 복잡, 균형 유지 비용, 해시맵 대비 단일 검색 성능이 떨어짐

### 실무 활용

- 데이터베이스 인덱스 (B-Tree, B+ Tree)
- 파일 시스템 디렉터리 구조
- 네트워크 라우팅 테이블 (Trie, Radix Tree)
- 구문 분석 트리 (AST, Abstract Syntax Tree)
- 우선순위 큐 (Heap), 작업 스케줄러
- Redis의 Sorted Set (Skip List, 트리의 대안)

---

## 7. 그래프 (Graph)

### 개념

**정점(Vertex)과 간선(Edge)의 집합**으로 이루어진 자료구조입니다. 트리는 사이클이 없는 특수한 그래프입니다.

### 종류

- **방향 그래프 (Directed Graph)**: 간선에 방향이 있음 (A -> B)
- **무방향 그래프 (Undirected Graph)**: 간선에 방향이 없음 (A -- B)
- **가중 그래프 (Weighted Graph)**: 간선에 가중치(비용)가 있음
- **DAG (Directed Acyclic Graph)**: 방향이 있고 사이클이 없는 그래프

### 표현 방법

#### 인접 행렬 (Adjacency Matrix)

```
    A  B  C  D
A [ 0, 1, 1, 0 ]
B [ 1, 0, 0, 1 ]
C [ 1, 0, 0, 1 ]
D [ 0, 1, 1, 0 ]
```

- 공간: O(V²)
- 간선 존재 확인: O(1)
- 정점이 적고 간선이 많을 때(밀집 그래프) 유리

#### 인접 리스트 (Adjacency List)

```
A -> [B, C]
B -> [A, D]
C -> [A, D]
D -> [B, C]
```

- 공간: O(V + E)
- 간선 존재 확인: O(degree)
- 정점이 많고 간선이 적을 때(희소 그래프) 유리

### 코드 예제

```java
// 인접 리스트 기반 가중 그래프
public class WeightedGraph {
    private final Map<String, List<Edge>> adjacencyList = new HashMap<>();

    public record Edge(String to, int weight) {}

    public void addVertex(String vertex) {
        adjacencyList.putIfAbsent(vertex, new ArrayList<>());
    }

    public void addEdge(String from, String to, int weight) {
        adjacencyList.computeIfAbsent(from, k -> new ArrayList<>())
                     .add(new Edge(to, weight));
    }

    // BFS: 너비 우선 탐색
    public List<String> bfs(String start) {
        List<String> result = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        Queue<String> queue = new LinkedList<>();

        visited.add(start);
        queue.offer(start);

        while (!queue.isEmpty()) {
            String current = queue.poll();
            result.add(current);

            for (Edge edge : adjacencyList.getOrDefault(current, List.of())) {
                if (!visited.contains(edge.to())) {
                    visited.add(edge.to());
                    queue.offer(edge.to());
                }
            }
        }
        return result;
    }

    // DFS: 깊이 우선 탐색
    public List<String> dfs(String start) {
        List<String> result = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        dfsHelper(start, visited, result);
        return result;
    }

    private void dfsHelper(String vertex, Set<String> visited,
                           List<String> result) {
        visited.add(vertex);
        result.add(vertex);
        for (Edge edge : adjacencyList.getOrDefault(vertex, List.of())) {
            if (!visited.contains(edge.to())) {
                dfsHelper(edge.to(), visited, result);
            }
        }
    }

    // Dijkstra 최단 경로 알고리즘
    public Map<String, Integer> dijkstra(String start) {
        Map<String, Integer> distances = new HashMap<>();
        PriorityQueue<Edge> pq = new PriorityQueue<>(
            Comparator.comparingInt(Edge::weight)
        );

        // 모든 정점까지의 거리를 무한대로 초기화
        for (String vertex : adjacencyList.keySet()) {
            distances.put(vertex, Integer.MAX_VALUE);
        }
        distances.put(start, 0);
        pq.offer(new Edge(start, 0));

        while (!pq.isEmpty()) {
            Edge current = pq.poll();

            if (current.weight() > distances.get(current.to())) {
                continue; // 이미 더 짧은 경로를 찾았음
            }

            for (Edge edge : adjacencyList.getOrDefault(
                    current.to(), List.of())) {
                int newDist = distances.get(current.to()) + edge.weight();
                if (newDist < distances.get(edge.to())) {
                    distances.put(edge.to(), newDist);
                    pq.offer(new Edge(edge.to(), newDist));
                }
            }
        }
        return distances;
    }
}
```

```python
from collections import defaultdict, deque
import heapq

class WeightedGraph:
    def __init__(self):
        self.graph = defaultdict(list)  # {vertex: [(neighbor, weight), ...]}

    def add_edge(self, u, v, weight):
        self.graph[u].append((v, weight))

    def bfs(self, start):
        visited = {start}
        queue = deque([start])
        result = []

        while queue:
            vertex = queue.popleft()
            result.append(vertex)

            for neighbor, _ in self.graph[vertex]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return result

    def dijkstra(self, start):
        distances = {v: float('inf') for v in self.graph}
        distances[start] = 0
        pq = [(0, start)]

        while pq:
            dist, vertex = heapq.heappop(pq)

            if dist > distances[vertex]:
                continue

            for neighbor, weight in self.graph[vertex]:
                new_dist = dist + weight
                if new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist
                    heapq.heappush(pq, (new_dist, neighbor))

        return distances


# 네트워크 토폴로지 예제
network = WeightedGraph()
network.add_edge("서울", "부산", 325)
network.add_edge("서울", "대전", 140)
network.add_edge("대전", "부산", 200)
network.add_edge("대전", "광주", 150)
network.add_edge("광주", "부산", 180)

# 서울에서 각 도시까지의 최단 거리
shortest = network.dijkstra("서울")
# {'서울': 0, '대전': 140, '부산': 325, '광주': 290}
```

### 장단점

- **장점**: 복잡한 관계를 표현 가능, 네트워크/의존성 모델링에 최적
- **단점**: 구현 복잡, 탐색 알고리즘 비용이 높을 수 있음

### 실무 활용

- 네트워크 라우팅 (최단 경로 알고리즘: Dijkstra, Bellman-Ford)
- 소셜 네트워크 (친구 관계, 추천 시스템)
- 의존성 관리 (패키지 매니저의 의존성 그래프, DAG)
- CI/CD 파이프라인 (작업 실행 순서, 위상 정렬)
- 가비지 컬렉션 (도달 가능성 분석)

---

## 자료구조 비교 총정리

| 자료구조 | 접근 | 검색 | 삽입 | 삭제 | 공간 | 주요 용도 |
|---------|------|------|------|------|------|----------|
| 배열 | O(1) | O(n) | O(n) | O(n) | O(n) | 랜덤 접근, 버퍼 |
| 연결 리스트 | O(n) | O(n) | O(1)* | O(1)* | O(n) | 빈번한 삽입/삭제 |
| 스택 | O(n) | O(n) | O(1) | O(1) | O(n) | LIFO 처리, DFS |
| 큐 | O(n) | O(n) | O(1) | O(1) | O(n) | FIFO 처리, BFS |
| 해시맵 | - | O(1) | O(1) | O(1) | O(n) | 키-값 매핑, 캐시 |
| BST | - | O(log n) | O(log n) | O(log n) | O(n) | 정렬 데이터, 범위 검색 |
| 힙 | - | O(n) | O(log n) | O(log n) | O(n) | 우선순위 큐 |
| 그래프 | - | - | O(1) | O(1) | O(V+E) | 관계 모델링 |

(*) 위치를 이미 알고 있는 경우

---

## 자료구조 선택 가이드

실무에서 자료구조를 선택할 때는 다음 질문을 고려하세요.

1. **어떤 연산이 가장 빈번한가?** 검색이 많으면 HashMap, 정렬된 검색이 필요하면 TreeMap.
2. **데이터의 크기는 얼마나 되는가?** 소량이면 단순한 배열로 충분할 수 있습니다.
3. **순서가 중요한가?** FIFO이면 큐, LIFO이면 스택, 정렬 순서이면 트리.
4. **동시성이 필요한가?** ConcurrentHashMap, ConcurrentLinkedQueue 등을 고려.
5. **메모리 제약이 있는가?** 배열이 가장 메모리 효율적입니다.

---

## 마무리

자료구조는 컴퓨터 과학의 근본이며, 어떤 분야의 개발자든 반드시 이해해야 하는 기초입니다. 특히 백엔드/시스템 개발에서는 적절한 자료구조 선택이 시스템 성능에 직접적인 영향을 미칩니다.

이 글에서 다룬 7가지 자료구조는 실무에서 가장 빈번히 마주치는 것들입니다. 각 자료구조의 시간복잡도와 장단점을 숙지하고, 문제 상황에 맞는 최적의 자료구조를 선택하는 연습을 꾸준히 하시기 바랍니다.

다음 글에서는 이러한 자료구조를 활용한 **알고리즘**에 대해 알아보겠습니다.
