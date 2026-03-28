---
title: '객체지향 프로그래밍의 핵심 개념'
date: 2026-03-28
tags: ['OOP', 'Programming', 'CS Fundamentals']
excerpt: '캡슐화, 상속, 다형성, 추상화 등 객체지향 프로그래밍의 4대 원칙과 SOLID 원칙을 실무 관점에서 정리합니다.'
draft: false
---

## 객체지향 프로그래밍이란

객체지향 프로그래밍(Object-Oriented Programming, OOP)은 프로그램을 **객체(Object)**라는 단위로 구성하는 프로그래밍 패러다임입니다. 각 객체는 데이터(속성)와 그 데이터를 조작하는 메서드(행위)를 하나의 단위로 묶어 관리합니다.

절차적 프로그래밍이 "어떤 순서로 처리할 것인가"에 초점을 맞추었다면, 객체지향 프로그래밍은 "어떤 객체가 어떤 책임을 가지는가"에 초점을 맞춥니다. 이 관점의 전환은 대규모 소프트웨어를 설계하고 유지보수하는 데 결정적인 차이를 만들어냅니다.

현대의 거의 모든 주류 언어(Java, C++, Python, C#, Kotlin, Swift 등)가 객체지향을 지원하며, 백엔드 시스템 개발에서는 사실상 필수적으로 이해해야 하는 패러다임입니다.

---

## 4대 핵심 원칙

### 1. 캡슐화 (Encapsulation)

캡슐화는 객체의 **내부 상태를 외부로부터 숨기고**, 정해진 인터페이스를 통해서만 상호작용하도록 하는 원칙입니다. 이를 통해 객체 내부의 구현이 변경되더라도 외부에 영향을 주지 않습니다.

#### 왜 중요한가

- **정보 은닉**: 외부에서 내부 구현 세부사항에 의존하지 않으므로, 내부 로직을 자유롭게 변경할 수 있습니다.
- **무결성 보장**: 데이터에 대한 접근을 제어하여 잘못된 상태 변경을 방지합니다.
- **모듈성 향상**: 객체가 독립적인 단위로 동작하므로 코드 재사용성과 테스트 용이성이 높아집니다.

#### Java 예제

```java
public class BankAccount {
    // 외부에서 직접 접근 불가
    private double balance;
    private final String accountId;

    public BankAccount(String accountId, double initialBalance) {
        this.accountId = accountId;
        this.balance = initialBalance;
    }

    // 입금: 비즈니스 규칙을 캡슐화
    public void deposit(double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("입금액은 0보다 커야 합니다.");
        }
        this.balance += amount;
    }

    // 출금: 잔액 부족 검증을 내부에서 처리
    public void withdraw(double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("출금액은 0보다 커야 합니다.");
        }
        if (amount > this.balance) {
            throw new IllegalStateException("잔액이 부족합니다.");
        }
        this.balance -= amount;
    }

    // 읽기 전용 접근
    public double getBalance() {
        return this.balance;
    }

    public String getAccountId() {
        return this.accountId;
    }
}
```

위 예제에서 `balance` 필드는 `private`으로 선언되어 외부에서 직접 수정할 수 없습니다. 반드시 `deposit()`이나 `withdraw()` 메서드를 통해서만 변경이 가능하며, 이 과정에서 유효성 검증이 수행됩니다. 만약 `balance`가 `public`이었다면, 외부 코드 어디에서든 `account.balance = -9999;` 같은 비정상적 조작이 가능해집니다.

#### Python 예제

```python
class BankAccount:
    def __init__(self, account_id: str, initial_balance: float):
        self._account_id = account_id   # 관례적 private
        self.__balance = initial_balance  # name mangling으로 보호

    def deposit(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("입금액은 0보다 커야 합니다.")
        self.__balance += amount

    def withdraw(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("출금액은 0보다 커야 합니다.")
        if amount > self.__balance:
            raise ValueError("잔액이 부족합니다.")
        self.__balance -= amount

    @property
    def balance(self) -> float:
        return self.__balance
```

Python은 언어 수준의 접근 제어자가 없지만, `_` 접두사(관례적 private)와 `__` 접두사(name mangling)를 통해 캡슐화를 표현합니다.

---

### 2. 상속 (Inheritance)

상속은 기존 클래스(부모 클래스)의 **속성과 메서드를 새로운 클래스(자식 클래스)가 물려받아** 재사용하고 확장하는 메커니즘입니다.

#### 왜 중요한가

- **코드 재사용**: 공통 로직을 부모 클래스에 정의하고 여러 자식 클래스에서 재사용합니다.
- **계층적 분류**: 현실 세계의 "is-a" 관계를 코드로 표현할 수 있습니다.
- **확장성**: 기존 코드를 수정하지 않고 새로운 기능을 추가할 수 있습니다.

#### Java 예제

```java
// 기본 네트워크 패킷 처리기
public abstract class PacketHandler {
    protected final Logger logger;

    public PacketHandler() {
        this.logger = LoggerFactory.getLogger(getClass());
    }

    // 템플릿 메서드: 전체 처리 흐름 정의
    public final void handle(Packet packet) {
        if (!validate(packet)) {
            logger.warn("유효하지 않은 패킷: {}", packet.getId());
            return;
        }
        process(packet);
        log(packet);
    }

    protected boolean validate(Packet packet) {
        return packet != null && packet.getPayload().length > 0;
    }

    // 하위 클래스에서 구현
    protected abstract void process(Packet packet);

    protected void log(Packet packet) {
        logger.info("패킷 처리 완료: {}", packet.getId());
    }
}

// TCP 패킷 전용 처리기
public class TcpPacketHandler extends PacketHandler {
    @Override
    protected boolean validate(Packet packet) {
        // 부모의 기본 검증 + TCP 고유 검증
        return super.validate(packet) && packet.getProtocol() == Protocol.TCP;
    }

    @Override
    protected void process(Packet packet) {
        // TCP 패킷 고유 처리 로직
        verifyChecksum(packet);
        reassembleSegments(packet);
        deliverToApplication(packet);
    }

    private void verifyChecksum(Packet packet) { /* ... */ }
    private void reassembleSegments(Packet packet) { /* ... */ }
    private void deliverToApplication(Packet packet) { /* ... */ }
}

// UDP 패킷 전용 처리기
public class UdpPacketHandler extends PacketHandler {
    @Override
    protected void process(Packet packet) {
        // UDP는 간단하게 바로 전달
        deliverToApplication(packet);
    }

    private void deliverToApplication(Packet packet) { /* ... */ }
}
```

이 예제에서 `PacketHandler`는 패킷 처리의 공통 흐름을 정의하고, `TcpPacketHandler`와 `UdpPacketHandler`는 각 프로토콜에 맞는 구체적인 처리 로직만 구현합니다.

#### 상속 사용 시 주의점

상속은 강력하지만 남용하면 오히려 코드를 복잡하게 만듭니다. 몇 가지 주의점이 있습니다.

- **깊은 상속 계층 피하기**: 3단계 이상의 상속은 코드 추적을 어렵게 만듭니다.
- **상속보다 조합(Composition) 선호**: "has-a" 관계는 상속이 아닌 조합으로 표현해야 합니다.
- **리스코프 치환 원칙(LSP) 준수**: 자식 클래스는 부모 클래스를 완전히 대체할 수 있어야 합니다.

---

### 3. 다형성 (Polymorphism)

다형성은 **같은 인터페이스로 서로 다른 구현을 호출**할 수 있는 능력입니다. 호출하는 쪽은 구체적인 타입을 알 필요 없이, 공통 인터페이스만으로 동작을 실행합니다.

#### 왜 중요한가

- **유연한 설계**: 새로운 타입을 추가해도 기존 코드를 수정할 필요가 없습니다.
- **느슨한 결합**: 구현이 아닌 인터페이스에 의존하므로 모듈 간 결합도가 낮아집니다.
- **확장에 유리**: Open-Closed 원칙의 기반이 됩니다.

#### Java 예제

```java
// 공통 인터페이스 정의
public interface MessageSerializer {
    byte[] serialize(Message message);
    Message deserialize(byte[] data);
    String getContentType();
}

// JSON 직렬화 구현
public class JsonSerializer implements MessageSerializer {
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public byte[] serialize(Message message) {
        return mapper.writeValueAsBytes(message);
    }

    @Override
    public Message deserialize(byte[] data) {
        return mapper.readValue(data, Message.class);
    }

    @Override
    public String getContentType() {
        return "application/json";
    }
}

// Protocol Buffers 직렬화 구현
public class ProtobufSerializer implements MessageSerializer {
    @Override
    public byte[] serialize(Message message) {
        return message.toProto().toByteArray();
    }

    @Override
    public Message deserialize(byte[] data) {
        return Message.fromProto(MessageProto.parseFrom(data));
    }

    @Override
    public String getContentType() {
        return "application/protobuf";
    }
}

// 사용하는 쪽: 어떤 Serializer인지 몰라도 됨
public class MessageBroker {
    private final MessageSerializer serializer;

    public MessageBroker(MessageSerializer serializer) {
        this.serializer = serializer;
    }

    public void publish(String topic, Message message) {
        byte[] payload = serializer.serialize(message);
        String contentType = serializer.getContentType();
        // 직렬화 방식에 관계없이 동일한 코드로 동작
        broker.send(topic, payload, contentType);
    }
}
```

`MessageBroker`는 `MessageSerializer` 인터페이스에만 의존합니다. JSON이든 Protobuf이든, 혹은 미래에 추가될 새로운 직렬화 포맷이든, `MessageBroker` 코드는 전혀 수정할 필요가 없습니다.

---

### 4. 추상화 (Abstraction)

추상화는 **복잡한 시스템에서 핵심적인 개념만 드러내고 불필요한 세부사항은 숨기는** 것입니다. 사용자가 알아야 할 것과 몰라도 되는 것을 명확히 구분합니다.

#### 왜 중요한가

- **복잡성 관리**: 시스템의 복잡한 내부 동작을 감추고 단순한 인터페이스를 제공합니다.
- **관심사 분리**: 각 계층이 자신의 역할에만 집중할 수 있습니다.
- **변경 용이성**: 내부 구현을 변경해도 추상화된 인터페이스를 사용하는 코드에 영향이 없습니다.

#### Python 예제

```python
from abc import ABC, abstractmethod
from typing import Any

class Database(ABC):
    """데이터베이스 추상 계층.
    사용자는 SQL인지 NoSQL인지 알 필요 없이 동일한 인터페이스로 데이터를 다룹니다.
    """

    @abstractmethod
    def connect(self, connection_string: str) -> None:
        pass

    @abstractmethod
    def find(self, collection: str, query: dict) -> list[dict]:
        pass

    @abstractmethod
    def insert(self, collection: str, document: dict) -> str:
        pass

    @abstractmethod
    def update(self, collection: str, query: dict, data: dict) -> int:
        pass

    @abstractmethod
    def delete(self, collection: str, query: dict) -> int:
        pass


class PostgresDatabase(Database):
    def connect(self, connection_string: str) -> None:
        self._conn = psycopg2.connect(connection_string)

    def find(self, collection: str, query: dict) -> list[dict]:
        # SQL로 변환하여 실행
        sql = self._build_select(collection, query)
        cursor = self._conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(sql, list(query.values()))
        return cursor.fetchall()

    def insert(self, collection: str, document: dict) -> str:
        sql = self._build_insert(collection, document)
        cursor = self._conn.cursor()
        cursor.execute(sql, list(document.values()))
        self._conn.commit()
        return str(cursor.lastrowid)

    # update, delete도 동일한 패턴...


class MongoDatabase(Database):
    def connect(self, connection_string: str) -> None:
        self._client = pymongo.MongoClient(connection_string)
        self._db = self._client.get_default_database()

    def find(self, collection: str, query: dict) -> list[dict]:
        return list(self._db[collection].find(query))

    def insert(self, collection: str, document: dict) -> str:
        result = self._db[collection].insert_one(document)
        return str(result.inserted_id)

    # update, delete도 동일한 패턴...


# 사용하는 쪽: 어떤 DB인지 전혀 신경 쓰지 않음
class UserRepository:
    def __init__(self, db: Database):
        self._db = db

    def find_active_users(self) -> list[dict]:
        return self._db.find("users", {"status": "active"})
```

`UserRepository`는 `Database`라는 추상화에만 의존하므로, PostgreSQL에서 MongoDB로 전환하더라도 `UserRepository` 코드는 한 줄도 변경할 필요가 없습니다.

---

## SOLID 원칙

SOLID는 Robert C. Martin이 정리한 객체지향 설계의 5가지 원칙입니다. OOP의 4대 원칙을 실무에서 올바르게 적용하기 위한 구체적인 가이드라인이라고 할 수 있습니다.

### S - 단일 책임 원칙 (Single Responsibility Principle)

> 클래스는 변경되어야 하는 이유가 단 하나여야 한다.

하나의 클래스가 여러 책임을 가지면, 한 가지 이유로 인한 변경이 다른 기능에 의도치 않은 영향을 미칩니다.

```java
// 나쁜 예: 하나의 클래스가 여러 책임을 가짐
public class UserService {
    public void createUser(User user) { /* 사용자 생성 */ }
    public String generateReport(User user) { /* HTML 리포트 생성 */ }
    public void sendEmail(User user, String content) { /* 이메일 발송 */ }
}

// 좋은 예: 각 클래스가 하나의 책임만 가짐
public class UserService {
    public void createUser(User user) { /* 사용자 생성 */ }
}
public class UserReportGenerator {
    public String generate(User user) { /* HTML 리포트 생성 */ }
}
public class EmailService {
    public void send(String to, String content) { /* 이메일 발송 */ }
}
```

### O - 개방-폐쇄 원칙 (Open-Closed Principle)

> 확장에는 열려 있고, 수정에는 닫혀 있어야 한다.

새로운 기능을 추가할 때 기존 코드를 수정하는 것이 아니라, 새로운 코드를 추가하는 방식으로 확장해야 합니다. 앞서 다형성 예제의 `MessageSerializer`가 이 원칙의 전형적인 사례입니다.

### L - 리스코프 치환 원칙 (Liskov Substitution Principle)

> 부모 클래스의 인스턴스를 자식 클래스의 인스턴스로 대체해도 프로그램이 올바르게 동작해야 한다.

```java
// 위반 사례: 정사각형이 직사각형을 상속
class Rectangle {
    protected int width, height;
    public void setWidth(int w) { this.width = w; }
    public void setHeight(int h) { this.height = h; }
    public int getArea() { return width * height; }
}

class Square extends Rectangle {
    @Override
    public void setWidth(int w) { this.width = w; this.height = w; }
    @Override
    public void setHeight(int h) { this.width = h; this.height = h; }
}

// Rectangle을 기대하는 코드에서 Square를 쓰면 예상과 다르게 동작
void resize(Rectangle r) {
    r.setWidth(5);
    r.setHeight(10);
    assert r.getArea() == 50; // Square이면 실패! (100이 됨)
}
```

### I - 인터페이스 분리 원칙 (Interface Segregation Principle)

> 클라이언트가 사용하지 않는 메서드에 의존하도록 강제해서는 안 된다.

하나의 거대한 인터페이스보다 여러 개의 구체적인 인터페이스가 낫습니다.

```java
// 나쁜 예: 하나의 거대한 인터페이스
interface Worker {
    void work();
    void eat();
    void sleep();
}

// 좋은 예: 역할별로 분리된 인터페이스
interface Workable { void work(); }
interface Feedable { void eat(); }
interface Sleepable { void sleep(); }

// 로봇은 먹거나 자지 않음
class Robot implements Workable {
    public void work() { /* 작업 수행 */ }
}
```

### D - 의존 역전 원칙 (Dependency Inversion Principle)

> 고수준 모듈은 저수준 모듈에 의존해서는 안 되며, 둘 다 추상화에 의존해야 한다.

앞서 추상화 예제의 `UserRepository`가 `Database` 인터페이스에 의존하는 것이 이 원칙의 적용입니다. 구체적인 `PostgresDatabase`나 `MongoDatabase`에 직접 의존하지 않으므로, 저수준 모듈의 변경이 고수준 모듈에 영향을 주지 않습니다.

---

## 실무에서의 적용 관점

### 올바른 추상화 수준 찾기

실무에서 가장 어려운 것은 "어디까지 추상화할 것인가"입니다. 과도한 추상화는 오히려 코드를 이해하기 어렵게 만듭니다. 현재의 요구사항과 예측 가능한 변경을 기반으로 적절한 수준을 판단해야 합니다.

```
// YAGNI(You Ain't Gonna Need It) 원칙을 기억하세요.
// 당장 필요하지 않은 추상화를 미리 만들지 마세요.
```

### 상속 vs 조합

실무에서는 상속보다 조합(Composition)을 더 자주 사용합니다. Spring Framework의 의존성 주입(DI)이 대표적인 조합 기반 설계입니다.

```java
// 조합 기반 설계: 유연하고 테스트하기 쉬움
public class OrderService {
    private final PaymentGateway paymentGateway;
    private final InventoryService inventoryService;
    private final NotificationService notificationService;

    public OrderService(
        PaymentGateway paymentGateway,
        InventoryService inventoryService,
        NotificationService notificationService
    ) {
        this.paymentGateway = paymentGateway;
        this.inventoryService = inventoryService;
        this.notificationService = notificationService;
    }
}
```

### 테스트 용이성

OOP를 올바르게 적용하면 단위 테스트 작성이 쉬워집니다. 인터페이스에 의존하는 코드는 Mock 객체를 주입하여 독립적으로 테스트할 수 있습니다.

```java
@Test
void shouldPublishMessage() {
    // Mock 직렬화기 주입
    MessageSerializer mockSerializer = mock(MessageSerializer.class);
    when(mockSerializer.serialize(any())).thenReturn(new byte[]{1, 2, 3});

    MessageBroker broker = new MessageBroker(mockSerializer);
    broker.publish("topic", new Message("hello"));

    verify(mockSerializer).serialize(any());
}
```

### 도메인 모델링

현실 세계의 비즈니스 도메인을 객체로 모델링하는 것이 OOP의 가장 강력한 활용입니다. DDD(Domain-Driven Design)에서는 이를 체계적으로 다룹니다.

---

## 마무리

객체지향 프로그래밍의 4대 원칙은 서로 독립적이지 않고 긴밀하게 연결되어 있습니다.

- **캡슐화**로 내부를 보호하고
- **추상화**로 핵심만 드러내며
- **상속**으로 공통 로직을 재사용하고
- **다형성**으로 유연하게 확장합니다

SOLID 원칙은 이 4대 원칙을 실무에서 올바르게 적용하기 위한 구체적인 지침입니다. 중요한 것은 원칙을 맹목적으로 따르는 것이 아니라, 각 원칙이 해결하고자 하는 문제를 이해하고 상황에 맞게 적용하는 것입니다.

다음 글에서는 이러한 OOP 원칙을 기반으로 만들어진 **디자인 패턴**에 대해 알아보겠습니다.
