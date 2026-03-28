---
title: '디자인 패턴 입문: 왜 패턴을 알아야 하는가'
date: 2026-03-28
tags: ['Design Pattern', 'OOP', 'Architecture']
excerpt: 'GoF 디자인 패턴의 개요와 분류를 살펴보고, 실무에서 자주 사용되는 Singleton, Observer, Strategy, Factory 패턴을 예제와 함께 알아봅니다.'
draft: false
---

## 디자인 패턴이란

디자인 패턴(Design Pattern)은 소프트웨어 설계에서 **반복적으로 나타나는 문제에 대한 검증된 해결책**입니다. 1994년 Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides(이른바 Gang of Four, GoF)가 저서 *"Design Patterns: Elements of Reusable Object-Oriented Software"*에서 23가지 패턴을 체계적으로 정리하면서 널리 알려졌습니다.

### 왜 패턴을 알아야 하는가

1. **공통 어휘 제공**: "여기는 Observer 패턴을 쓰자"라고 말하면, 팀원 모두가 의미를 정확히 이해합니다. 설계 의도를 코드 수백 줄 대신 한 단어로 전달할 수 있습니다.

2. **검증된 해결책**: 수십 년간 수많은 프로젝트에서 검증된 설계 방법입니다. 바퀴를 다시 발명할 필요가 없습니다.

3. **유지보수성 향상**: 패턴을 따르면 코드 구조가 예측 가능해지고, 새로운 팀원이 코드를 이해하는 시간이 단축됩니다.

4. **프레임워크 이해**: Spring, React, Django 등 주요 프레임워크는 내부적으로 다양한 디자인 패턴을 활용합니다. 패턴을 알면 프레임워크의 설계 의도를 깊이 이해할 수 있습니다.

---

## GoF 패턴의 분류

GoF의 23가지 패턴은 목적에 따라 세 가지 범주로 분류됩니다.

### 생성 패턴 (Creational Patterns)

객체의 **생성 과정을 추상화**하여, 시스템이 어떤 구체 클래스를 사용하는지에 독립적이 되도록 합니다.

| 패턴 | 핵심 아이디어 |
|------|-------------|
| **Singleton** | 클래스의 인스턴스를 단 하나만 생성 |
| **Factory Method** | 객체 생성을 하위 클래스에 위임 |
| **Abstract Factory** | 관련 객체군을 일괄 생성 |
| **Builder** | 복잡한 객체를 단계적으로 생성 |
| **Prototype** | 기존 객체를 복제하여 새 객체 생성 |

### 구조 패턴 (Structural Patterns)

클래스와 객체를 **조합하여 더 큰 구조**를 형성하는 방법을 다룹니다.

| 패턴 | 핵심 아이디어 |
|------|-------------|
| **Adapter** | 호환되지 않는 인터페이스를 연결 |
| **Bridge** | 추상화와 구현을 분리 |
| **Composite** | 트리 구조의 객체를 일관되게 처리 |
| **Decorator** | 객체에 동적으로 기능 추가 |
| **Facade** | 복잡한 서브시스템에 단순한 인터페이스 제공 |
| **Flyweight** | 공유를 통해 대량의 세밀한 객체를 효율적으로 관리 |
| **Proxy** | 객체에 대한 접근을 제어하는 대리 객체 |

### 행위 패턴 (Behavioral Patterns)

객체 간의 **책임 분배와 알고리즘**을 다룹니다.

| 패턴 | 핵심 아이디어 |
|------|-------------|
| **Observer** | 상태 변경을 관찰자에게 자동 통지 |
| **Strategy** | 알고리즘을 캡슐화하여 교체 가능하게 |
| **Command** | 요청을 객체로 캡슐화 |
| **Template Method** | 알고리즘의 골격을 정의하고 세부 구현을 위임 |
| **Iterator** | 컬렉션의 내부 구조를 노출하지 않고 순회 |
| **State** | 상태에 따라 동작을 변경 |
| **Chain of Responsibility** | 요청을 처리자 체인을 통해 전달 |
| 기타 | Mediator, Memento, Visitor, Interpreter |

---

## 자주 쓰이는 패턴 상세

### 1. Singleton 패턴

**의도**: 클래스의 인스턴스가 시스템 전체에서 단 하나만 존재하도록 보장하고, 전역 접근점을 제공합니다.

**사용 시기**: 설정 관리자, 로깅 시스템, 커넥션 풀, 스레드 풀 등 시스템에서 하나만 존재해야 하는 리소스를 관리할 때 사용합니다.

#### Java 구현

```java
// 1. 가장 단순한 형태 (Thread-safe하지 않음!)
public class NaiveSingleton {
    private static NaiveSingleton instance;

    private NaiveSingleton() {}

    public static NaiveSingleton getInstance() {
        if (instance == null) {
            instance = new NaiveSingleton(); // 두 스레드가 동시에 진입하면?
        }
        return instance;
    }
}

// 2. 이중 검사 락 (Double-Checked Locking)
public class ThreadSafeSingleton {
    private static volatile ThreadSafeSingleton instance;

    private ThreadSafeSingleton() {}

    public static ThreadSafeSingleton getInstance() {
        if (instance == null) {
            synchronized (ThreadSafeSingleton.class) {
                if (instance == null) {
                    instance = new ThreadSafeSingleton();
                }
            }
        }
        return instance;
    }
}

// 3. Enum을 이용한 방법 (Joshua Bloch 추천, 가장 안전)
public enum DatabaseConfig {
    INSTANCE;

    private String url;
    private int maxConnections;

    public void load(String configPath) {
        // 설정 파일에서 값 로드
        this.url = properties.getProperty("db.url");
        this.maxConnections = Integer.parseInt(
            properties.getProperty("db.maxConnections")
        );
    }

    public String getUrl() { return url; }
    public int getMaxConnections() { return maxConnections; }
}

// 사용
DatabaseConfig.INSTANCE.load("/etc/app/db.properties");
String dbUrl = DatabaseConfig.INSTANCE.getUrl();
```

#### Python 구현

```python
class ConnectionPool:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self, max_connections: int = 10):
        if self._initialized:
            return
        self._initialized = True
        self._max_connections = max_connections
        self._pool: list[Connection] = []
        self._initialize_pool()

    def _initialize_pool(self):
        for _ in range(self._max_connections):
            self._pool.append(Connection())

    def acquire(self) -> Connection:
        # 풀에서 커넥션 하나를 가져옴
        ...

    def release(self, conn: Connection) -> None:
        # 커넥션을 풀에 반환
        ...
```

#### 주의점

Singleton은 전역 상태를 만들기 때문에, 남용하면 테스트가 어려워지고 코드 간 숨겨진 의존성이 생깁니다. DI(Dependency Injection) 컨테이너를 사용하는 환경에서는 컨테이너 수준에서 스코프를 관리하는 것이 더 바람직합니다. Spring의 `@Scope("singleton")`이 대표적입니다.

---

### 2. Factory Method 패턴

**의도**: 객체 생성 로직을 별도의 메서드나 클래스로 분리하여, 어떤 구체 클래스의 인스턴스를 만들지를 하위 클래스 또는 설정에 의해 결정하도록 합니다.

**사용 시기**: 생성할 객체의 타입이 런타임에 결정되거나, 객체 생성 로직이 복잡한 경우에 사용합니다.

#### Java 예제

```java
// 로그 전송 채널을 생성하는 팩토리
public interface LogChannel {
    void send(String message);
}

public class FileLogChannel implements LogChannel {
    private final Path logFile;

    public FileLogChannel(Path logFile) {
        this.logFile = logFile;
    }

    @Override
    public void send(String message) {
        Files.writeString(logFile, message + "\n",
            StandardOpenOption.APPEND, StandardOpenOption.CREATE);
    }
}

public class SyslogChannel implements LogChannel {
    private final String host;
    private final int port;

    public SyslogChannel(String host, int port) {
        this.host = host;
        this.port = port;
    }

    @Override
    public void send(String message) {
        // UDP로 syslog 서버에 전송
    }
}

public class KafkaLogChannel implements LogChannel {
    private final KafkaProducer<String, String> producer;
    private final String topic;

    @Override
    public void send(String message) {
        producer.send(new ProducerRecord<>(topic, message));
    }
}

// 팩토리: 설정에 따라 적절한 채널 생성
public class LogChannelFactory {
    public static LogChannel create(LogConfig config) {
        return switch (config.getType()) {
            case FILE   -> new FileLogChannel(config.getFilePath());
            case SYSLOG -> new SyslogChannel(config.getHost(), config.getPort());
            case KAFKA  -> new KafkaLogChannel(config.getBrokers(), config.getTopic());
            default     -> throw new IllegalArgumentException(
                "지원하지 않는 로그 채널: " + config.getType()
            );
        };
    }
}

// 사용: 어떤 채널인지 알 필요 없음
LogChannel channel = LogChannelFactory.create(config);
channel.send("Application started");
```

새로운 로그 채널(예: Elasticsearch)을 추가할 때, `LogChannelFactory`에 case 하나만 추가하면 됩니다. 나머지 코드는 전혀 수정할 필요가 없습니다.

---

### 3. Observer 패턴

**의도**: 한 객체의 상태가 변경되면, 이에 **의존하는 모든 객체에 자동으로 알림**을 보내는 일대다(one-to-many) 의존 관계를 정의합니다.

**사용 시기**: 이벤트 기반 시스템, UI 상태 관리, 모니터링 시스템 등에서 널리 사용됩니다.

#### Java 예제

```java
// 이벤트 시스템 구현
public interface EventListener<T> {
    void onEvent(T event);
}

public class EventBus {
    private final Map<Class<?>, List<EventListener<?>>> listeners
        = new ConcurrentHashMap<>();

    public <T> void subscribe(Class<T> eventType, EventListener<T> listener) {
        listeners.computeIfAbsent(eventType, k -> new CopyOnWriteArrayList<>())
                 .add(listener);
    }

    public <T> void unsubscribe(Class<T> eventType, EventListener<T> listener) {
        List<EventListener<?>> list = listeners.get(eventType);
        if (list != null) {
            list.remove(listener);
        }
    }

    @SuppressWarnings("unchecked")
    public <T> void publish(T event) {
        List<EventListener<?>> list = listeners.get(event.getClass());
        if (list != null) {
            for (EventListener<?> listener : list) {
                ((EventListener<T>) listener).onEvent(event);
            }
        }
    }
}

// 이벤트 정의
public record ServerHealthEvent(
    String serverId,
    double cpuUsage,
    double memoryUsage,
    Instant timestamp
) {}

// 관찰자들
public class AlertService implements EventListener<ServerHealthEvent> {
    @Override
    public void onEvent(ServerHealthEvent event) {
        if (event.cpuUsage() > 90.0) {
            sendAlert("CPU 사용률 경고: " + event.serverId()
                + " - " + event.cpuUsage() + "%");
        }
    }
}

public class MetricsCollector implements EventListener<ServerHealthEvent> {
    @Override
    public void onEvent(ServerHealthEvent event) {
        // Prometheus 등 메트릭 시스템에 기록
        metrics.gauge("server.cpu", event.cpuUsage(),
            "server_id", event.serverId());
    }
}

public class AuditLogger implements EventListener<ServerHealthEvent> {
    @Override
    public void onEvent(ServerHealthEvent event) {
        auditLog.info("서버 상태: {} CPU={} MEM={}",
            event.serverId(), event.cpuUsage(), event.memoryUsage());
    }
}

// 구성
EventBus bus = new EventBus();
bus.subscribe(ServerHealthEvent.class, new AlertService());
bus.subscribe(ServerHealthEvent.class, new MetricsCollector());
bus.subscribe(ServerHealthEvent.class, new AuditLogger());

// 이벤트 발행: 모든 관찰자에게 자동 전파
bus.publish(new ServerHealthEvent("web-01", 95.2, 72.1, Instant.now()));
```

서버 모니터링 에이전트가 `ServerHealthEvent`를 발행하면, 알림 서비스, 메트릭 수집기, 감사 로거가 각각 독립적으로 이벤트를 처리합니다. 새로운 관찰자(예: 자동 스케일링 트리거)를 추가해도 발행 쪽 코드는 변경할 필요가 없습니다.

---

### 4. Strategy 패턴

**의도**: 알고리즘을 별도의 클래스로 캡슐화하여, 런타임에 알고리즘을 **교체할 수 있게** 합니다.

**사용 시기**: 같은 문제를 해결하는 여러 알고리즘이 존재하고, 상황에 따라 다른 알고리즘을 사용해야 할 때 적합합니다.

#### Java 예제

```java
// 데이터 압축 전략
public interface CompressionStrategy {
    byte[] compress(byte[] data);
    byte[] decompress(byte[] data);
    String getAlgorithmName();
}

public class GzipCompression implements CompressionStrategy {
    @Override
    public byte[] compress(byte[] data) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (GZIPOutputStream gzip = new GZIPOutputStream(baos)) {
            gzip.write(data);
        }
        return baos.toByteArray();
    }

    @Override
    public byte[] decompress(byte[] data) {
        try (GZIPInputStream gzip = new GZIPInputStream(
                new ByteArrayInputStream(data))) {
            return gzip.readAllBytes();
        }
    }

    @Override
    public String getAlgorithmName() { return "gzip"; }
}

public class LZ4Compression implements CompressionStrategy {
    @Override
    public byte[] compress(byte[] data) {
        LZ4Compressor compressor = LZ4Factory.fastestInstance().fastCompressor();
        return compressor.compress(data);
    }

    @Override
    public byte[] decompress(byte[] data) {
        LZ4SafeDecompressor decompressor =
            LZ4Factory.fastestInstance().safeDecompressor();
        return decompressor.decompress(data, data.length * 4);
    }

    @Override
    public String getAlgorithmName() { return "lz4"; }
}

public class ZstdCompression implements CompressionStrategy {
    @Override
    public byte[] compress(byte[] data) {
        return Zstd.compress(data);
    }

    @Override
    public byte[] decompress(byte[] data) {
        return Zstd.decompress(data, (int) Zstd.decompressedSize(data));
    }

    @Override
    public String getAlgorithmName() { return "zstd"; }
}

// 컨텍스트: 압축 전략을 사용하는 파일 전송 시스템
public class FileTransferService {
    private CompressionStrategy compression;

    public FileTransferService(CompressionStrategy compression) {
        this.compression = compression;
    }

    // 런타임에 전략 변경 가능
    public void setCompression(CompressionStrategy compression) {
        this.compression = compression;
    }

    public void send(byte[] fileData, String destination) {
        byte[] compressed = compression.compress(fileData);
        double ratio = (double) compressed.length / fileData.length * 100;
        logger.info("압축 완료 [{}]: {}% ({}→{} bytes)",
            compression.getAlgorithmName(), ratio,
            fileData.length, compressed.length);
        transport.send(destination, compressed);
    }
}

// 상황에 따라 전략 선택
FileTransferService service;
if (networkBandwidth < THRESHOLD_LOW) {
    // 대역폭이 낮으면 압축률이 높은 Zstd
    service = new FileTransferService(new ZstdCompression());
} else if (cpuBudget < THRESHOLD_LOW) {
    // CPU 여유가 없으면 빠른 LZ4
    service = new FileTransferService(new LZ4Compression());
} else {
    // 기본: 범용적인 Gzip
    service = new FileTransferService(new GzipCompression());
}
```

네트워크 대역폭, CPU 여유 등 런타임 조건에 따라 최적의 압축 알고리즘을 동적으로 선택할 수 있습니다. `if-else` 분기가 비즈니스 로직 내부에 직접 들어가는 것이 아니라, 전략 객체를 교체하는 방식으로 깔끔하게 처리됩니다.

---

## 안티패턴: 패턴 사용 시 주의할 점

디자인 패턴을 잘못 사용하면 오히려 해가 됩니다. 흔한 안티패턴을 알아봅시다.

### 1. 패턴 남용 (Pattern Fever)

모든 문제에 패턴을 적용하려는 유혹입니다. 단순한 `if-else`로 충분한 곳에 Strategy 패턴을 도입하면, 인터페이스 하나, 구현 클래스 3개, 팩토리 클래스 1개가 추가되어 복잡성만 높아집니다.

```
"패턴을 쓸 수 있다"와 "패턴을 써야 한다"는 다릅니다.
```

**기준**: 동일한 분기가 3곳 이상에서 반복되거나, 변경 가능성이 확실할 때만 패턴 도입을 고려하세요.

### 2. God Object (만능 클래스)

모든 기능을 하나의 클래스에 몰아넣는 패턴입니다. Singleton으로 만든 `ApplicationManager`가 설정, 로깅, DB, 캐시, 인증을 전부 관리하는 경우가 전형적입니다.

```java
// 안티패턴: God Object
public class ApplicationManager {
    public void loadConfig() { ... }
    public void initDatabase() { ... }
    public void setupCache() { ... }
    public void authenticateUser() { ... }
    public void handleRequest() { ... }
    public void generateReport() { ... }
    public void sendNotification() { ... }
    // 수백 개의 메서드...
}
```

### 3. Circular Dependency (순환 의존)

Observer 패턴을 잘못 적용하면, A가 B를 관찰하고 B가 A를 관찰하는 순환이 생깁니다. 이벤트가 무한 루프에 빠질 수 있습니다.

### 4. Premature Abstraction (섣부른 추상화)

"나중에 변경될 수 있으니까"라는 이유로 모든 곳에 인터페이스를 만드는 것입니다. 구현이 하나뿐인 인터페이스는 불필요한 간접 참조만 추가합니다.

---

## 프레임워크 속 디자인 패턴

실무에서 사용하는 프레임워크에도 디자인 패턴이 녹아 있습니다.

| 프레임워크 | 패턴 | 적용 사례 |
|-----------|------|----------|
| **Spring** | Factory | BeanFactory, ApplicationContext |
| **Spring** | Singleton | Bean의 기본 스코프 |
| **Spring** | Proxy | AOP, @Transactional |
| **Spring** | Observer | ApplicationEvent, @EventListener |
| **Spring** | Template Method | JdbcTemplate, RestTemplate |
| **Java I/O** | Decorator | BufferedReader(FileReader) |
| **Java Streams** | Iterator + Builder | Stream API의 파이프라인 |
| **Netty** | Chain of Responsibility | ChannelPipeline, ChannelHandler |
| **Servlet** | Chain of Responsibility | Filter Chain |

프레임워크를 사용할 때 "왜 이렇게 설계했는가"를 이해하면, 단순히 API를 외우는 것보다 훨씬 깊은 활용이 가능합니다.

---

## 마무리

디자인 패턴은 목적이 아니라 도구입니다. 핵심은 패턴 자체가 아니라 패턴이 해결하는 **문제**를 이해하는 것입니다.

- 객체 생성이 복잡해질 때 -> 생성 패턴
- 클래스 간 관계가 뒤엉킬 때 -> 구조 패턴
- 객체 간 통신이 복잡할 때 -> 행위 패턴

패턴을 처음 학습할 때는 Singleton, Factory, Observer, Strategy 이 4가지부터 확실히 이해하는 것을 추천합니다. 이 4가지만 잘 알아도 실무에서 만나는 대부분의 설계 문제를 해결할 수 있으며, 다른 패턴을 학습할 때도 기반이 됩니다.

다음 글에서는 효율적인 소프트웨어를 만들기 위한 기반인 **자료구조**에 대해 총정리합니다.
