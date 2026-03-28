---
title: "리눅스 네트워크 프로그래밍 기초: 소켓부터 epoll까지"
date: 2026-03-28
tags: ['Linux', 'Network', 'Systems Programming', 'C']
excerpt: "BSD 소켓 API의 기본 흐름부터 I/O 멀티플렉싱의 발전 과정까지, 리눅스 네트워크 프로그래밍의 핵심을 정리합니다."
series: "systems"
draft: false
---

리눅스에서 네트워크 프로그래밍은 모든 서버 개발의 기반이 되는 영역이다. HTTP 서버, 데이터베이스, 메시지 큐, 게임 서버 등 네트워크 통신이 필요한 모든 시스템은 결국 소켓(socket) 위에서 동작한다. 이 글에서는 BSD 소켓 API의 기본 흐름부터 고성능 서버를 위한 I/O 멀티플렉싱 기법까지 단계별로 살펴본다.

## BSD 소켓 API 기본

### 소켓이란?

소켓은 네트워크 통신의 **엔드포인트(endpoint)**다. 운영체제는 소켓을 파일 디스크립터(file descriptor)로 관리하며, 일반 파일처럼 `read()`/`write()` 시스템 콜로 데이터를 주고받을 수 있다. 이것이 유닉스의 "모든 것은 파일이다(Everything is a file)" 철학이 네트워크에 적용된 결과다.

### 소켓 생성: socket()

```c
#include <sys/socket.h>

int socket(int domain, int type, int protocol);
```

- `domain`: 주소 체계. `AF_INET`(IPv4), `AF_INET6`(IPv6), `AF_UNIX`(로컬 프로세스 간 통신)
- `type`: 소켓 타입. `SOCK_STREAM`(TCP), `SOCK_DGRAM`(UDP)
- `protocol`: 보통 `0` (자동 선택)

```c
// TCP 소켓 생성
int sockfd = socket(AF_INET, SOCK_STREAM, 0);
if (sockfd < 0) {
    perror("socket");
    exit(EXIT_FAILURE);
}
```

### TCP 서버의 전체 흐름

TCP 서버는 다음과 같은 순서로 소켓 API를 호출한다.

```
socket() → bind() → listen() → accept() → read()/write() → close()
```

각 단계를 코드와 함께 살펴보자.

#### bind(): 주소 바인딩

소켓에 IP 주소와 포트 번호를 할당한다.

```c
#include <netinet/in.h>

struct sockaddr_in addr;
memset(&addr, 0, sizeof(addr));
addr.sin_family = AF_INET;
addr.sin_addr.s_addr = htonl(INADDR_ANY);  // 모든 인터페이스
addr.sin_port = htons(8080);                // 포트 8080

// SO_REUSEADDR 옵션: TIME_WAIT 상태에서도 바인딩 허용
int opt = 1;
setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

if (bind(sockfd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
    perror("bind");
    exit(EXIT_FAILURE);
}
```

`htonl()`과 `htons()`는 호스트 바이트 순서를 네트워크 바이트 순서(빅 엔디안)로 변환한다. 네트워크 프로토콜은 빅 엔디안을 표준으로 사용하기 때문이다.

#### listen(): 연결 대기

소켓을 수동(passive) 모드로 전환하여 클라이언트 연결을 대기한다.

```c
#define BACKLOG 128

if (listen(sockfd, BACKLOG) < 0) {
    perror("listen");
    exit(EXIT_FAILURE);
}
```

`BACKLOG`은 커널이 관리하는 **연결 대기 큐(backlog queue)**의 크기다. 이 큐가 가득 차면 새로운 연결 요청은 거부된다. 리눅스에서는 `/proc/sys/net/core/somaxconn` 값이 상한이 된다.

#### accept(): 연결 수락

대기 큐에서 연결을 꺼내 새로운 소켓(connected socket)을 생성한다.

```c
struct sockaddr_in client_addr;
socklen_t client_len = sizeof(client_addr);

int connfd = accept(sockfd, (struct sockaddr *)&client_addr, &client_len);
if (connfd < 0) {
    perror("accept");
    exit(EXIT_FAILURE);
}

// 클라이언트 IP 주소 출력
char client_ip[INET_ADDRSTRLEN];
inet_ntop(AF_INET, &client_addr.sin_addr, client_ip, sizeof(client_ip));
printf("Connection from %s:%d\n", client_ip, ntohs(client_addr.sin_port));
```

중요한 점은 `accept()`가 반환하는 소켓(`connfd`)과 원래 리스닝 소켓(`sockfd`)은 별개라는 것이다. 리스닝 소켓은 계속 새로운 연결을 받을 수 있다.

### TCP 클라이언트의 전체 흐름

```
socket() → connect() → write()/read() → close()
```

```c
struct sockaddr_in server_addr;
memset(&server_addr, 0, sizeof(server_addr));
server_addr.sin_family = AF_INET;
server_addr.sin_port = htons(8080);
inet_pton(AF_INET, "127.0.0.1", &server_addr.sin_addr);

int sockfd = socket(AF_INET, SOCK_STREAM, 0);
if (connect(sockfd, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
    perror("connect");
    exit(EXIT_FAILURE);
}

// 데이터 송수신
const char *msg = "Hello, Server!";
write(sockfd, msg, strlen(msg));

char buf[1024];
ssize_t n = read(sockfd, buf, sizeof(buf) - 1);
buf[n] = '\0';
printf("Received: %s\n", buf);

close(sockfd);
```

### 완전한 Echo 서버 예제

클라이언트가 보낸 데이터를 그대로 되돌려주는 간단한 에코 서버를 만들어 보자.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#define PORT 8080
#define BUF_SIZE 1024
#define BACKLOG 128

int main() {
    int sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0) { perror("socket"); exit(1); }

    int opt = 1;
    setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_addr.s_addr = htonl(INADDR_ANY),
        .sin_port = htons(PORT)
    };

    if (bind(sockfd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind"); exit(1);
    }
    if (listen(sockfd, BACKLOG) < 0) {
        perror("listen"); exit(1);
    }

    printf("Echo server listening on port %d\n", PORT);

    while (1) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        int connfd = accept(sockfd, (struct sockaddr *)&client_addr, &client_len);
        if (connfd < 0) { perror("accept"); continue; }

        char buf[BUF_SIZE];
        ssize_t n;
        while ((n = read(connfd, buf, sizeof(buf))) > 0) {
            write(connfd, buf, n);
        }
        close(connfd);
    }

    close(sockfd);
    return 0;
}
```

이 서버는 한 번에 하나의 클라이언트만 처리할 수 있다. 동시에 여러 클라이언트를 처리하려면 멀티프로세스, 멀티스레드, 또는 I/O 멀티플렉싱을 사용해야 한다.

## TCP vs UDP

| 항목 | TCP | UDP |
|------|-----|-----|
| 연결 | 연결 지향 (3-way handshake) | 비연결 |
| 신뢰성 | 순서 보장, 재전송, 흐름/혼잡 제어 | 보장 없음 |
| 속도 | 상대적으로 느림 | 빠름 |
| 오버헤드 | 헤더 20바이트 이상 | 헤더 8바이트 |
| 용도 | HTTP, SSH, DB 연결 | DNS, 동영상 스트리밍, 게임 |

UDP 서버는 `listen()`과 `accept()` 없이 `recvfrom()`/`sendto()`로 직접 데이터를 주고받는다.

```c
// UDP 서버 핵심 코드
int sockfd = socket(AF_INET, SOCK_DGRAM, 0);

struct sockaddr_in addr = {
    .sin_family = AF_INET,
    .sin_addr.s_addr = htonl(INADDR_ANY),
    .sin_port = htons(9090)
};
bind(sockfd, (struct sockaddr *)&addr, sizeof(addr));

char buf[BUF_SIZE];
struct sockaddr_in client_addr;
socklen_t client_len = sizeof(client_addr);

while (1) {
    ssize_t n = recvfrom(sockfd, buf, sizeof(buf), 0,
                         (struct sockaddr *)&client_addr, &client_len);
    // 에코: 받은 데이터를 그대로 반환
    sendto(sockfd, buf, n, 0,
           (struct sockaddr *)&client_addr, client_len);
}
```

## 블로킹 vs 논블로킹 I/O

### 블로킹 I/O

기본적으로 소켓은 블로킹 모드로 동작한다. `read()`를 호출하면 데이터가 도착할 때까지 프로세스가 대기(sleep) 상태가 된다. `accept()`도 새 연결이 올 때까지 블로킹된다.

블로킹 I/O에서 동시 접속을 처리하는 전통적 방법은 **프로세스/스레드를 클라이언트마다 생성**하는 것이다.

```c
// fork 기반 동시 처리
while (1) {
    int connfd = accept(sockfd, NULL, NULL);
    pid_t pid = fork();
    if (pid == 0) {
        // 자식 프로세스: 클라이언트 처리
        close(sockfd);
        handle_client(connfd);
        close(connfd);
        exit(0);
    }
    // 부모 프로세스: 연결 소켓 닫고 다음 연결 대기
    close(connfd);
}
```

이 방식은 직관적이지만, 클라이언트가 수천 개가 되면 프로세스/스레드 수가 폭발적으로 늘어나 **C10K 문제**에 직면한다.

### 논블로킹 I/O

소켓을 논블로킹 모드로 설정하면, 데이터가 없을 때 `read()`가 즉시 `-1`을 반환하고 `errno`가 `EAGAIN` 또는 `EWOULDBLOCK`으로 설정된다.

```c
#include <fcntl.h>

// 소켓을 논블로킹으로 설정
int flags = fcntl(sockfd, F_GETFL, 0);
fcntl(sockfd, F_SETFL, flags | O_NONBLOCK);
```

논블로킹 I/O 자체만으로는 별 의미가 없다. 핵심은 **I/O 멀티플렉싱**과 결합하는 것이다.

## I/O 멀티플렉싱: select, poll, epoll

I/O 멀티플렉싱은 **하나의 스레드에서 여러 소켓을 동시에 감시**하여, 준비된 소켓에 대해서만 I/O를 수행하는 기법이다.

### select()

가장 오래된 I/O 멀티플렉싱 API다. POSIX 표준이라 이식성이 좋다.

```c
#include <sys/select.h>

fd_set read_fds;
FD_ZERO(&read_fds);
FD_SET(sockfd, &read_fds);
int max_fd = sockfd;

while (1) {
    fd_set tmp_fds = read_fds;
    struct timeval timeout = { .tv_sec = 5, .tv_usec = 0 };

    int ready = select(max_fd + 1, &tmp_fds, NULL, NULL, &timeout);
    if (ready < 0) { perror("select"); break; }
    if (ready == 0) { printf("timeout\n"); continue; }

    for (int fd = 0; fd <= max_fd; fd++) {
        if (!FD_ISSET(fd, &tmp_fds)) continue;

        if (fd == sockfd) {
            // 새 연결
            int connfd = accept(sockfd, NULL, NULL);
            FD_SET(connfd, &read_fds);
            if (connfd > max_fd) max_fd = connfd;
        } else {
            // 데이터 수신
            char buf[BUF_SIZE];
            ssize_t n = read(fd, buf, sizeof(buf));
            if (n <= 0) {
                close(fd);
                FD_CLR(fd, &read_fds);
            } else {
                write(fd, buf, n);
            }
        }
    }
}
```

**select의 한계:**
- `fd_set`의 크기가 `FD_SETSIZE`(보통 1024)로 제한
- 매번 전체 fd_set을 커널에 복사해야 함
- 어떤 fd가 준비됐는지 알려면 전체를 순회해야 함 → O(n)

### poll()

select의 FD_SETSIZE 제한을 해결한 API다. 배열 기반이라 감시할 fd 수에 제한이 없다.

```c
#include <poll.h>

#define MAX_CLIENTS 10000

struct pollfd fds[MAX_CLIENTS];
int nfds = 1;

fds[0].fd = sockfd;
fds[0].events = POLLIN;

while (1) {
    int ready = poll(fds, nfds, 5000);  // 5초 타임아웃
    if (ready < 0) { perror("poll"); break; }

    // 리스닝 소켓 확인
    if (fds[0].revents & POLLIN) {
        int connfd = accept(sockfd, NULL, NULL);
        fds[nfds].fd = connfd;
        fds[nfds].events = POLLIN;
        nfds++;
    }

    // 클라이언트 소켓 확인
    for (int i = 1; i < nfds; i++) {
        if (fds[i].revents & POLLIN) {
            char buf[BUF_SIZE];
            ssize_t n = read(fds[i].fd, buf, sizeof(buf));
            if (n <= 0) {
                close(fds[i].fd);
                fds[i] = fds[nfds - 1];  // 마지막으로 교체
                nfds--;
                i--;
            } else {
                write(fds[i].fd, buf, n);
            }
        }
    }
}
```

**poll의 한계:**
- select와 마찬가지로 매번 전체 배열을 커널에 복사
- 준비된 fd를 찾기 위해 전체 순회 필요 → O(n)

### epoll (Linux 전용)

epoll은 리눅스 2.6에서 도입된 고성능 I/O 멀티플렉싱 API다. nginx, Redis, Node.js 등 거의 모든 고성능 리눅스 서버가 epoll을 사용한다.

```c
#include <sys/epoll.h>

#define MAX_EVENTS 64

int epfd = epoll_create1(0);

struct epoll_event ev;
ev.events = EPOLLIN;
ev.data.fd = sockfd;
epoll_ctl(epfd, EPOLL_CTL_ADD, sockfd, &ev);

struct epoll_event events[MAX_EVENTS];

while (1) {
    int nready = epoll_wait(epfd, events, MAX_EVENTS, -1);

    for (int i = 0; i < nready; i++) {
        if (events[i].data.fd == sockfd) {
            // 새 연결
            int connfd = accept(sockfd, NULL, NULL);

            // 논블로킹 설정
            int flags = fcntl(connfd, F_GETFL, 0);
            fcntl(connfd, F_SETFL, flags | O_NONBLOCK);

            ev.events = EPOLLIN | EPOLLET;  // Edge Triggered
            ev.data.fd = connfd;
            epoll_ctl(epfd, EPOLL_CTL_ADD, connfd, &ev);
        } else {
            // 데이터 수신
            char buf[BUF_SIZE];
            ssize_t n = read(events[i].data.fd, buf, sizeof(buf));
            if (n <= 0) {
                epoll_ctl(epfd, EPOLL_CTL_DEL, events[i].data.fd, NULL);
                close(events[i].data.fd);
            } else {
                write(events[i].data.fd, buf, n);
            }
        }
    }
}

close(epfd);
```

**epoll의 핵심 장점:**

1. **O(1) 이벤트 통지**: 커널이 준비된 fd만 알려주므로 전체 순회가 필요 없다.
2. **커널 내부에서 감시 목록 관리**: 매번 fd 목록을 복사하지 않는다.
3. **감시하는 fd 수에 관계없이 일정한 성능**: 수만~수십만 동시 연결에서도 성능 저하가 미미하다.

### Level Triggered vs Edge Triggered

epoll은 두 가지 트리거 모드를 지원한다.

**Level Triggered (LT, 기본값):**
- 소켓 버퍼에 데이터가 남아있는 한 계속 이벤트를 발생시킨다.
- select/poll과 동일한 의미론. 사용하기 쉽다.

**Edge Triggered (ET):**
- 소켓 상태가 **변경**될 때만 이벤트를 발생시킨다.
- 한 번 통지를 받으면 데이터를 모두 읽어야 한다(`EAGAIN`이 나올 때까지 반복).
- 이벤트 발생 횟수가 줄어 성능이 약간 더 좋을 수 있다.
- 논블로킹 소켓과 함께 사용해야 한다.

```c
// Edge Triggered 모드에서의 올바른 read 패턴
while (1) {
    ssize_t n = read(fd, buf, sizeof(buf));
    if (n < 0) {
        if (errno == EAGAIN || errno == EWOULDBLOCK) {
            break;  // 더 이상 읽을 데이터 없음
        }
        perror("read");
        break;
    }
    if (n == 0) {
        // 연결 종료
        close(fd);
        break;
    }
    // 데이터 처리
    process_data(buf, n);
}
```

### select / poll / epoll 비교 요약

| 항목 | select | poll | epoll |
|------|--------|------|-------|
| fd 수 제한 | FD_SETSIZE (1024) | 없음 | 없음 |
| 성능 (fd 수 증가 시) | O(n) 열화 | O(n) 열화 | O(1) 유지 |
| 커널-유저 데이터 복사 | 매번 전체 | 매번 전체 | 변경 시만 |
| 플랫폼 | POSIX 표준 | POSIX 표준 | Linux 전용 |
| Edge Triggered | 미지원 | 미지원 | 지원 |

## 실무 팁

### 1. SO_REUSEADDR은 거의 항상 설정하라

서버가 종료 후 재시작할 때, 이전 소켓이 TIME_WAIT 상태에 있으면 같은 포트에 바인딩할 수 없다. `SO_REUSEADDR`을 설정하면 이 문제를 해결할 수 있다.

### 2. SIGPIPE를 무시하라

연결이 끊긴 소켓에 write하면 SIGPIPE 시그널이 발생하여 프로세스가 종료될 수 있다.

```c
signal(SIGPIPE, SIG_IGN);
// 또는 send()에 MSG_NOSIGNAL 플래그 사용
send(fd, buf, n, MSG_NOSIGNAL);
```

### 3. read()/write()의 반환값을 항상 확인하라

네트워크 I/O에서는 요청한 바이트 수보다 적게 읽히거나 쓰일 수 있다. 반드시 반환값을 확인하고 필요하면 반복해야 한다.

```c
ssize_t writen(int fd, const void *buf, size_t count) {
    size_t nleft = count;
    const char *ptr = buf;

    while (nleft > 0) {
        ssize_t nwritten = write(fd, ptr, nleft);
        if (nwritten < 0) {
            if (errno == EINTR) continue;
            return -1;
        }
        nleft -= nwritten;
        ptr += nwritten;
    }
    return count;
}
```

### 4. TCP_NODELAY (Nagle 알고리즘 비활성화)

Nagle 알고리즘은 작은 패킷을 모아서 보내 네트워크 효율을 높이지만, 지연 시간이 증가한다. 실시간 응답이 중요한 서비스에서는 비활성화하는 것이 좋다.

```c
int flag = 1;
setsockopt(sockfd, IPPROTO_TCP, TCP_NODELAY, &flag, sizeof(flag));
```

### 5. 실전에서는 프레임워크를 활용하라

실무에서 epoll을 직접 다루는 경우는 드물다. 대부분 이벤트 루프 라이브러리(libevent, libev, libuv) 또는 고수준 프레임워크를 사용한다. 하지만 내부 동작 원리를 이해하고 있어야 성능 문제를 진단하고 최적화할 수 있다.

## 마무리

리눅스 네트워크 프로그래밍의 발전사는 곧 동시 접속 처리 기법의 발전사다.

1. **프로세스/스레드 per 클라이언트**: 직관적이지만 확장성 한계
2. **select/poll**: I/O 멀티플렉싱의 시작, 수천 fd에서 성능 저하
3. **epoll**: O(1) 이벤트 통지로 C10K 문제 해결

이 기초를 확실히 이해하면, Go의 goroutine + netpoller, Rust의 tokio, Java의 NIO 등 고수준 추상화가 내부적으로 어떻게 동작하는지 명확하게 파악할 수 있다.
