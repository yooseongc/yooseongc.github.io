---
title: "정렬 알고리즘 완전 정복: 비교 정렬부터 선형 정렬까지"
date: 2026-03-28
tags: ['Algorithm', 'Sorting', 'CS Fundamentals']
excerpt: "버블 정렬부터 기수 정렬까지, 주요 정렬 알고리즘의 원리와 구현을 체계적으로 정리합니다."
series: "algorithms"
draft: false
---

정렬(Sorting)은 컴퓨터 과학에서 가장 기본이 되는 연산 중 하나다. 데이터베이스 인덱싱, 검색 최적화, 데이터 분석 등 거의 모든 분야에서 정렬이 활용된다. 이 글에서는 주요 정렬 알고리즘을 **비교 기반 정렬**과 **비비교 기반(선형) 정렬**로 나누어 살펴보고, 각 알고리즘의 동작 원리, 시간 복잡도, Python 구현, 그리고 실무에서의 선택 기준까지 다룬다.

## 비교 기반 정렬 (Comparison Sort)

비교 기반 정렬은 두 원소의 대소 비교를 통해 순서를 결정하는 방식이다. 이론적으로 비교 기반 정렬의 **하한(lower bound)**은 `O(n log n)`이다. 즉, 어떤 비교 기반 정렬 알고리즘이든 최악의 경우 `Ω(n log n)` 비교가 필요하다.

### 1. 버블 정렬 (Bubble Sort)

인접한 두 원소를 비교하여 순서가 잘못되어 있으면 교환하는 과정을 반복한다. 한 번의 패스(pass)가 끝나면 가장 큰 원소가 배열 끝으로 "버블"처럼 올라간다.

| 항목 | 값 |
|------|-----|
| 시간 복잡도 (최선) | O(n) - 이미 정렬된 경우 |
| 시간 복잡도 (평균) | O(n²) |
| 시간 복잡도 (최악) | O(n²) |
| 공간 복잡도 | O(1) |
| 안정 정렬 | Yes |

```python
def bubble_sort(arr: list) -> list:
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        # 교환이 없었다면 이미 정렬 완료
        if not swapped:
            break
    return arr
```

`swapped` 플래그를 사용하면 이미 정렬된 배열에 대해 O(n)에 종료할 수 있다. 하지만 평균적으로 O(n²)이므로 실무에서는 거의 사용하지 않는다.

### 2. 선택 정렬 (Selection Sort)

배열에서 최솟값을 찾아 맨 앞 원소와 교환하고, 그다음 최솟값을 찾아 두 번째 원소와 교환하는 과정을 반복한다.

| 항목 | 값 |
|------|-----|
| 시간 복잡도 (모든 경우) | O(n²) |
| 공간 복잡도 | O(1) |
| 안정 정렬 | No |

```python
def selection_sort(arr: list) -> list:
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr
```

선택 정렬은 교환 횟수가 최대 `n-1`번으로, 교환 비용이 큰 경우에는 버블 정렬보다 유리할 수 있다. 그러나 비교 횟수는 항상 O(n²)이다. 또한 교환 과정에서 상대적 순서가 바뀔 수 있어 **불안정 정렬**이라는 점에 주의하자.

### 3. 삽입 정렬 (Insertion Sort)

배열을 정렬된 부분과 정렬되지 않은 부분으로 나누고, 정렬되지 않은 부분에서 하나씩 꺼내 정렬된 부분의 적절한 위치에 삽입한다.

| 항목 | 값 |
|------|-----|
| 시간 복잡도 (최선) | O(n) |
| 시간 복잡도 (평균/최악) | O(n²) |
| 공간 복잡도 | O(1) |
| 안정 정렬 | Yes |

```python
def insertion_sort(arr: list) -> list:
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr
```

삽입 정렬은 **거의 정렬된 데이터**에 매우 효율적이다. 또한 n이 작을 때(대략 10~50 이하) 오버헤드가 적어 빠르다. 이러한 특성 때문에 Python의 `sorted()`나 Java의 `Arrays.sort()`에서 **작은 부분 배열에 대한 정렬**로 삽입 정렬을 사용한다(Timsort의 핵심 구성 요소).

### 4. 병합 정렬 (Merge Sort)

분할 정복(Divide and Conquer) 패러다임을 따르는 대표적인 정렬 알고리즘이다. 배열을 반으로 나누고, 각각을 재귀적으로 정렬한 뒤, 두 정렬된 배열을 합친다.

| 항목 | 값 |
|------|-----|
| 시간 복잡도 (모든 경우) | O(n log n) |
| 공간 복잡도 | O(n) |
| 안정 정렬 | Yes |

```python
def merge_sort(arr: list) -> list:
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])

    return merge(left, right)

def merge(left: list, right: list) -> list:
    result = []
    i = j = 0

    while i < len(left) and j < len(right):
        if left[i] <= right[j]:  # <= 로 안정 정렬 보장
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1

    result.extend(left[i:])
    result.extend(right[j:])
    return result
```

병합 정렬의 핵심 장점은 **항상 O(n log n)**을 보장한다는 것이다. 최악의 경우에도 성능이 일정하다. 단점은 O(n)의 추가 메모리가 필요하다는 것이다. 연결 리스트(Linked List)에서는 추가 메모리 없이 병합 정렬이 가능하여, 연결 리스트의 정렬에는 병합 정렬이 최적의 선택이다.

### 5. 퀵 정렬 (Quick Sort)

분할 정복 방식이지만, 병합 정렬과 달리 **피벗(pivot)**을 기준으로 배열을 분할한다. 피벗보다 작은 원소는 왼쪽, 큰 원소는 오른쪽으로 보낸 뒤 각각을 재귀적으로 정렬한다.

| 항목 | 값 |
|------|-----|
| 시간 복잡도 (최선/평균) | O(n log n) |
| 시간 복잡도 (최악) | O(n²) - 피벗 선택이 매우 나쁜 경우 |
| 공간 복잡도 | O(log n) - 재귀 스택 |
| 안정 정렬 | No |

```python
import random

def quick_sort(arr: list) -> list:
    if len(arr) <= 1:
        return arr

    pivot = random.choice(arr)  # 랜덤 피벗 선택
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]

    return quick_sort(left) + middle + quick_sort(right)
```

위는 이해를 위한 간결한 구현이다. 실무에서는 in-place 파티션을 사용한다.

```python
def quick_sort_inplace(arr: list, low: int = 0, high: int = None) -> list:
    if high is None:
        high = len(arr) - 1

    if low < high:
        pivot_idx = partition(arr, low, high)
        quick_sort_inplace(arr, low, pivot_idx - 1)
        quick_sort_inplace(arr, pivot_idx + 1, high)

    return arr

def partition(arr: list, low: int, high: int) -> int:
    # median-of-three 피벗 선택
    mid = (low + high) // 2
    if arr[mid] < arr[low]:
        arr[low], arr[mid] = arr[mid], arr[low]
    if arr[high] < arr[low]:
        arr[low], arr[high] = arr[high], arr[low]
    if arr[mid] < arr[high]:
        arr[mid], arr[high] = arr[high], arr[mid]
    pivot = arr[high]

    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1
```

퀵 정렬은 **캐시 지역성(cache locality)**이 좋아 실제로는 병합 정렬보다 빠른 경우가 많다. 최악의 경우 O(n²)를 피하기 위해 **랜덤 피벗** 또는 **median-of-three** 전략을 사용한다.

### 6. 힙 정렬 (Heap Sort)

최대 힙(Max Heap) 자료구조를 이용한 정렬이다. 배열을 힙으로 구성한 뒤, 루트(최댓값)를 하나씩 꺼내 배열 끝에 배치한다.

| 항목 | 값 |
|------|-----|
| 시간 복잡도 (모든 경우) | O(n log n) |
| 공간 복잡도 | O(1) |
| 안정 정렬 | No |

```python
def heap_sort(arr: list) -> list:
    n = len(arr)

    # 최대 힙 구성 (heapify)
    for i in range(n // 2 - 1, -1, -1):
        sift_down(arr, n, i)

    # 루트(최댓값)를 끝으로 보내고 힙 크기 축소
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]
        sift_down(arr, i, 0)

    return arr

def sift_down(arr: list, heap_size: int, root: int):
    largest = root
    left = 2 * root + 1
    right = 2 * root + 2

    if left < heap_size and arr[left] > arr[largest]:
        largest = left
    if right < heap_size and arr[right] > arr[largest]:
        largest = right

    if largest != root:
        arr[root], arr[largest] = arr[largest], arr[root]
        sift_down(arr, heap_size, largest)
```

힙 정렬은 O(n log n)을 보장하면서 **추가 메모리를 사용하지 않는** 유일한 비교 기반 정렬이다. 하지만 캐시 지역성이 나쁘고 상수 계수가 커서 실측 성능은 퀵 정렬에 비해 느린 경우가 많다.

## 비비교 기반 정렬 (Non-Comparison Sort)

비교 기반 정렬의 O(n log n) 하한을 깨뜨리는 방법이 있다. 원소의 값 자체를 이용하여 정렬하면 **O(n)** 시간에 정렬이 가능하다. 단, 입력 데이터에 대한 사전 지식(범위, 자릿수 등)이 필요하다.

### 카운팅 정렬 (Counting Sort)

원소의 값을 인덱스로 사용하여 등장 횟수를 센 뒤, 누적 합을 이용해 각 원소의 최종 위치를 결정한다.

- **시간 복잡도**: O(n + k) (k는 원소의 최댓값)
- **공간 복잡도**: O(n + k)
- **안정 정렬**: Yes
- **제약**: 정수 또는 정수로 매핑 가능한 데이터, k가 n에 비해 지나치게 크지 않아야 효율적

```python
def counting_sort(arr: list, max_val: int = None) -> list:
    if not arr:
        return arr

    if max_val is None:
        max_val = max(arr)

    count = [0] * (max_val + 1)
    for x in arr:
        count[x] += 1

    # 누적 합 계산
    for i in range(1, len(count)):
        count[i] += count[i - 1]

    # 안정 정렬을 위해 뒤에서부터 배치
    output = [0] * len(arr)
    for x in reversed(arr):
        count[x] -= 1
        output[count[x]] = x

    return output
```

### 기수 정렬 (Radix Sort)

각 자릿수별로 카운팅 정렬(또는 다른 안정 정렬)을 적용한다. 가장 낮은 자릿수(LSD)부터 정렬하는 방식이 일반적이다.

- **시간 복잡도**: O(d × (n + k)) (d는 최대 자릿수, k는 기수)
- **공간 복잡도**: O(n + k)
- **안정 정렬**: Yes
- **제약**: 정수 또는 고정 길이 문자열에 적합

```python
def radix_sort(arr: list) -> list:
    if not arr:
        return arr

    max_val = max(arr)
    exp = 1

    while max_val // exp > 0:
        arr = counting_sort_by_digit(arr, exp)
        exp *= 10

    return arr

def counting_sort_by_digit(arr: list, exp: int) -> list:
    n = len(arr)
    output = [0] * n
    count = [0] * 10

    for x in arr:
        digit = (x // exp) % 10
        count[digit] += 1

    for i in range(1, 10):
        count[i] += count[i - 1]

    for x in reversed(arr):
        digit = (x // exp) % 10
        count[digit] -= 1
        output[count[digit]] = x

    return output
```

기수 정렬은 IP 주소 정렬, 고정 길이 문자열 정렬 등에 매우 효율적이다.

## 안정 정렬 vs 불안정 정렬

**안정 정렬(Stable Sort)**이란 동일한 키 값을 가진 원소들의 상대적 순서가 정렬 후에도 유지되는 정렬을 말한다.

예를 들어, 학생 목록을 이름순으로 정렬한 뒤 학년순으로 다시 정렬한다고 하자.

```
정렬 전: [(김철수, 2학년), (이영희, 1학년), (박민수, 2학년), (최지은, 1학년)]
이름순:  [(김철수, 2학년), (박민수, 2학년), (이영희, 1학년), (최지은, 1학년)]
학년순 (안정):   [(이영희, 1학년), (최지은, 1학년), (김철수, 2학년), (박민수, 2학년)]
학년순 (불안정): [(최지은, 1학년), (이영희, 1학년), (박민수, 2학년), (김철수, 2학년)]  ← 이름 순서 깨짐
```

안정 정렬을 사용하면 같은 학년 내에서 이름순이 유지된다. 불안정 정렬은 이를 보장하지 않는다.

| 안정 정렬 | 불안정 정렬 |
|-----------|------------|
| 버블 정렬 | 선택 정렬 |
| 삽입 정렬 | 퀵 정렬 |
| 병합 정렬 | 힙 정렬 |
| 카운팅 정렬 | |
| 기수 정렬 | |

## 정렬 알고리즘 비교 요약

| 알고리즘 | 최선 | 평균 | 최악 | 공간 | 안정 |
|---------|------|------|------|------|------|
| 버블 | O(n) | O(n²) | O(n²) | O(1) | Yes |
| 선택 | O(n²) | O(n²) | O(n²) | O(1) | No |
| 삽입 | O(n) | O(n²) | O(n²) | O(1) | Yes |
| 병합 | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| 퀵 | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| 힙 | O(n log n) | O(n log n) | O(n log n) | O(1) | No |
| 카운팅 | O(n+k) | O(n+k) | O(n+k) | O(n+k) | Yes |
| 기수 | O(d(n+k)) | O(d(n+k)) | O(d(n+k)) | O(n+k) | Yes |

## 실무에서의 선택 기준

### 언어 내장 정렬을 우선 사용하라

Python의 `sorted()`, Java의 `Arrays.sort()`, C++의 `std::sort()` 등은 고도로 최적화된 하이브리드 알고리즘을 사용한다.

- **Python**: Timsort (병합 정렬 + 삽입 정렬). 실제 데이터에서 자주 나타나는 부분 정렬 패턴을 활용한다.
- **C++**: Introsort (퀵 정렬 + 힙 정렬 + 삽입 정렬). 퀵 정렬의 재귀 깊이가 일정 수준을 넘으면 힙 정렬로 전환한다.
- **Java**: 기본 타입은 Dual-Pivot Quicksort, 객체는 Timsort.

### 직접 구현이 필요한 경우

1. **데이터 크기가 매우 작을 때 (n ≤ 50)**: 삽입 정렬이 오버헤드가 적어 가장 빠르다.
2. **메모리가 극도로 제한적일 때**: 힙 정렬 (O(1) 추가 공간).
3. **안정 정렬이 반드시 필요할 때**: 병합 정렬 또는 Timsort.
4. **정수/고정 길이 데이터를 대량 정렬할 때**: 기수 정렬이 O(n) 수준의 성능을 제공한다.
5. **거의 정렬된 데이터**: 삽입 정렬이 O(n)에 가깝게 동작한다.
6. **외부 정렬(External Sort)**: 디스크 기반 데이터는 병합 정렬 기반의 외부 정렬을 사용한다.

### 성능 측정 시 주의점

빅오 표기법은 점근적 분석이다. 실제 성능은 **상수 계수**, **캐시 지역성**, **분기 예측**, **메모리 할당 패턴** 등에 크게 영향받는다. 따라서 특정 환경에서의 최적 알고리즘은 반드시 벤치마크를 통해 확인해야 한다.

```python
import time
import random

def benchmark(sort_fn, data, name):
    arr = data.copy()
    start = time.perf_counter()
    sort_fn(arr)
    elapsed = time.perf_counter() - start
    print(f"{name}: {elapsed:.4f}s")

data = [random.randint(0, 100000) for _ in range(10000)]

benchmark(bubble_sort, data, "Bubble Sort")
benchmark(insertion_sort, data, "Insertion Sort")
benchmark(merge_sort, data, "Merge Sort")
benchmark(quick_sort, data, "Quick Sort")
benchmark(heap_sort, data, "Heap Sort")
benchmark(sorted, data, "Python sorted()")
```

## 마무리

정렬 알고리즘을 공부하는 것은 단순히 정렬 문제를 풀기 위해서가 아니다. 분할 정복, 힙 자료구조, 안정성 개념, 시간-공간 트레이드오프 등 컴퓨터 과학의 핵심 사고방식을 체득하는 과정이다. 실무에서는 대부분 언어 내장 정렬로 충분하지만, 각 알고리즘의 특성을 이해하고 있어야 적절한 도구를 선택할 수 있다.
