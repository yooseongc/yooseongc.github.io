---
title: "TLS와 인증서의 이해: HTTPS는 어떻게 동작하는가"
date: 2026-03-28
tags: ['TLS', 'Security', 'Network', 'Certificate']
excerpt: "TLS 핸드셰이크, 인증서 구조, CA 체인까지 HTTPS의 핵심 동작 원리를 체계적으로 정리합니다."
series: "security"
draft: false
---

웹 브라우저 주소창의 자물쇠 아이콘은 너무 익숙해서 그냥 지나치기 쉽다. 하지만 그 뒤에는 TLS(Transport Layer Security)라는 정교한 프로토콜과 X.509 인증서 체계가 동작하고 있다. 백엔드 개발자라면 인증서 발급, 갱신, 트러블슈팅을 직접 다루게 되므로, 그 내부 동작을 정확히 이해해야 한다. 이 글에서는 TLS 핸드셰이크 과정부터 인증서 구조, CA 체인, 실무에서의 관리 방법까지 체계적으로 살펴본다.

## 왜 TLS가 필요한가

HTTP는 평문(plaintext) 프로토콜이다. 클라이언트와 서버 사이의 모든 데이터가 암호화 없이 전송된다. 이는 다음과 같은 위협에 노출된다.

- **도청(Eavesdropping)**: 네트워크 경로상의 누군가가 데이터를 엿볼 수 있다.
- **변조(Tampering)**: 전송 중인 데이터를 몰래 수정할 수 있다.
- **위장(Impersonation)**: 가짜 서버가 진짜인 것처럼 속일 수 있다.

TLS는 이 세 가지 위협을 **기밀성(Confidentiality)**, **무결성(Integrity)**, **인증(Authentication)**으로 각각 해결한다.

## 암호화의 기초

TLS를 이해하려면 두 가지 암호화 방식을 먼저 알아야 한다.

### 대칭키 암호화 (Symmetric Encryption)

암호화와 복호화에 **같은 키**를 사용한다.

- 장점: 속도가 빠르다 (AES-256-GCM 등)
- 단점: 키를 안전하게 전달하는 방법이 필요하다
- 대표 알고리즘: AES, ChaCha20

```
평문 --[키 K로 암호화]--> 암호문 --[키 K로 복호화]--> 평문
```

### 비대칭키 암호화 (Asymmetric Encryption)

**공개키(Public Key)**와 **개인키(Private Key)** 쌍을 사용한다. 공개키로 암호화한 데이터는 개인키로만 복호화할 수 있고, 그 반대도 성립한다.

- 장점: 키 교환 문제가 없다 (공개키는 말 그대로 공개)
- 단점: 대칭키보다 수백~수천 배 느리다
- 대표 알고리즘: RSA, ECDSA, Ed25519

```
평문 --[공개키로 암호화]--> 암호문 --[개인키로 복호화]--> 평문
```

**디지털 서명**은 반대 방향으로 동작한다.

```
해시값 --[개인키로 서명]--> 서명값
서명값 --[공개키로 검증]--> 해시값 (원본과 비교)
```

### TLS의 접근: 하이브리드 방식

TLS는 두 방식을 조합한다.

1. **핸드셰이크 단계**: 비대칭키 암호화로 **세션 키(대칭키)**를 안전하게 교환
2. **데이터 전송 단계**: 교환한 대칭키로 실제 데이터를 고속 암호화

이렇게 하면 비대칭키의 키 교환 장점과 대칭키의 속도 장점을 모두 취할 수 있다.

## TLS 핸드셰이크 과정

TLS 1.3 기준으로 핸드셰이크 과정을 단계별로 살펴보자. TLS 1.3은 이전 버전(1.2)보다 핸드셰이크가 간소화되어 **1-RTT(Round Trip Time)**만에 완료된다.

### 1단계: Client Hello

클라이언트가 서버에 연결을 요청하며 다음 정보를 보낸다.

- 지원하는 TLS 버전
- 지원하는 암호 스위트(Cipher Suite) 목록
- 클라이언트가 생성한 랜덤 값
- **Key Share**: ECDHE 키 교환을 위한 클라이언트의 공개 파라미터
- SNI(Server Name Indication): 접속하려는 도메인 이름

```
Client → Server:
  ClientHello
    - supported_versions: TLS 1.3
    - cipher_suites: [TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256, ...]
    - key_share: (ECDHE public key)
    - server_name: example.com
```

SNI는 하나의 IP에서 여러 도메인을 호스팅할 때, 서버가 어떤 인증서를 보내야 하는지 결정하는 데 사용된다.

### 2단계: Server Hello + 인증서 + Finished

서버가 다음 정보를 한 번에 응답한다.

- 선택된 암호 스위트
- 서버의 Key Share (ECDHE 공개 파라미터)
- **서버 인증서** (X.509)
- 인증서 검증을 위한 **CertificateVerify** (서버 개인키로 서명)
- **Finished** 메시지 (핸드셰이크 무결성 검증)

```
Server → Client:
  ServerHello
    - cipher_suite: TLS_AES_256_GCM_SHA384
    - key_share: (ECDHE public key)
  EncryptedExtensions
  Certificate (X.509 인증서 체인)
  CertificateVerify (핸드셰이크 내용에 대한 서명)
  Finished
```

이 시점에서 양쪽 모두 ECDHE 키 교환을 통해 **동일한 세션 키**를 도출할 수 있다. 이후 모든 통신은 이 세션 키로 암호화된다.

### 3단계: Client Finished

클라이언트가 핸드셰이크 완료를 알리고, 이후 암호화된 애플리케이션 데이터 교환이 시작된다.

```
Client → Server:
  Finished
  [Application Data (HTTP Request)]
```

전체 과정은 단 1번의 왕복(1-RTT)으로 완료된다. TLS 1.2에서는 2-RTT가 필요했으므로 상당한 개선이다. 또한 TLS 1.3은 이전 연결 정보를 캐싱하여 **0-RTT(Zero Round Trip Time)** 재연결도 지원한다(단, 리플레이 공격에 주의 필요).

### 키 교환: ECDHE

TLS 1.3에서는 **ECDHE(Elliptic Curve Diffie-Hellman Ephemeral)**가 유일한 키 교환 방식이다. RSA 키 교환은 TLS 1.3에서 제거되었다.

ECDHE의 핵심 특성은 **전방 비밀성(Forward Secrecy)**이다. 서버의 개인키가 나중에 유출되더라도, 이전에 교환된 세션 키는 복호화할 수 없다. 각 세션마다 새로운 임시(ephemeral) 키 쌍을 생성하기 때문이다.

## X.509 인증서 구조

TLS에서 서버 인증에 사용되는 인증서는 **X.509** 표준을 따른다. 인증서는 본질적으로 "이 공개키가 이 도메인에 속한다"는 사실을 신뢰할 수 있는 제3자(CA)가 서명하여 보증하는 전자 문서다.

### 주요 필드

OpenSSL로 인증서 내용을 확인할 수 있다.

```bash
openssl x509 -in cert.pem -text -noout
```

출력 예시에서 주요 필드를 살펴보자.

```
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number: 04:00:00:00:00:01:15:4b:5a:c3:94
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: C=US, O=Let's Encrypt, CN=R3
        Validity
            Not Before: Mar  1 00:00:00 2026 GMT
            Not After : May 30 23:59:59 2026 GMT
        Subject: CN=example.com
        Subject Public Key Info:
            Public Key Algorithm: id-ecPublicKey
                Public-Key: (256 bit)
                ASN1 OID: prime256v1
        X509v3 extensions:
            X509v3 Subject Alternative Name:
                DNS:example.com, DNS:www.example.com
            X509v3 Key Usage: critical
                Digital Signature
            X509v3 Extended Key Usage:
                TLS Web Server Authentication
            X509v3 Basic Constraints: critical
                CA:FALSE
            Authority Information Access:
                OCSP - URI:http://r3.o.lencr.org
                CA Issuers - URI:http://r3.i.lencr.org/
```

| 필드 | 설명 |
|------|------|
| Version | 인증서 버전. 현재는 V3가 표준 |
| Serial Number | CA가 발급한 고유 번호 |
| Signature Algorithm | 서명에 사용된 알고리즘 |
| Issuer | 인증서를 발급한 CA 정보 |
| Validity | 유효 기간 (Not Before ~ Not After) |
| Subject | 인증서 소유자 (CN = Common Name) |
| Subject Alternative Name (SAN) | 인증서가 유효한 도메인 목록 |
| Public Key | 서버의 공개키 |
| Key Usage / Extended Key Usage | 키의 용도 제한 |
| Basic Constraints | CA 인증서 여부 (CA:TRUE / CA:FALSE) |

**SAN(Subject Alternative Name)**은 현재 도메인 검증의 핵심이다. 과거에는 CN(Common Name)을 사용했지만, 최신 브라우저와 라이브러리는 SAN만 확인한다.

## CA 체인 (Certificate Chain)

### 신뢰 모델

인증서 검증은 **신뢰 체인(Chain of Trust)** 모델을 따른다.

```
Root CA (자체 서명, 브라우저/OS에 내장)
  └── Intermediate CA (Root CA가 서명)
        └── 서버 인증서 (Intermediate CA가 서명)
```

- **Root CA**: 자체 서명(self-signed) 인증서. 브라우저와 OS의 신뢰 저장소(Trust Store)에 미리 설치되어 있다.
- **Intermediate CA (중간 CA)**: Root CA가 서명한 인증서. 실제 서버 인증서 발급에 사용된다.
- **서버 인증서 (Leaf/End-Entity)**: 실제 도메인에 바인딩된 인증서.

Root CA의 개인키가 유출되면 전체 PKI가 무너지므로, Root CA는 오프라인에서 보관하고 Intermediate CA를 통해서만 인증서를 발급한다.

### 인증서 검증 과정

클라이언트(브라우저)가 서버 인증서를 검증하는 과정은 다음과 같다.

1. 서버가 보낸 인증서 체인에서 leaf 인증서를 확인
2. leaf 인증서의 SAN이 접속하려는 도메인과 일치하는지 확인
3. leaf 인증서의 서명을 Intermediate CA의 공개키로 검증
4. Intermediate CA 인증서의 서명을 Root CA의 공개키로 검증
5. Root CA가 신뢰 저장소에 존재하는지 확인
6. 각 인증서의 유효 기간이 현재 시간 범위 내인지 확인
7. 각 인증서가 폐기(revoke)되지 않았는지 확인 (CRL 또는 OCSP)

```python
# Python에서 인증서 체인 확인 예시
import ssl
import socket

hostname = 'example.com'
context = ssl.create_default_context()

with socket.create_connection((hostname, 443)) as sock:
    with context.wrap_socket(sock, server_hostname=hostname) as ssock:
        cert = ssock.getpeercert()
        print(f"Subject: {cert['subject']}")
        print(f"Issuer: {cert['issuer']}")
        print(f"SAN: {cert['subjectAltName']}")
        print(f"Not Before: {cert['notBefore']}")
        print(f"Not After: {cert['notAfter']}")

        # DER 형식의 인증서
        der_cert = ssock.getpeercert(binary_form=True)
```

### 인증서 폐기 확인

인증서가 유효 기간 내라도 개인키 유출 등의 이유로 폐기될 수 있다.

- **CRL (Certificate Revocation List)**: CA가 주기적으로 발행하는 폐기 목록. 목록이 커질 수 있어 비효율적.
- **OCSP (Online Certificate Status Protocol)**: 특정 인증서의 상태를 실시간으로 조회. CRL보다 효율적.
- **OCSP Stapling**: 서버가 OCSP 응답을 미리 가져와 TLS 핸드셰이크에 포함. 클라이언트가 별도로 OCSP 서버에 접속할 필요 없음.

## PEM과 DER 포맷

인증서와 키는 두 가지 인코딩 형식으로 저장된다.

### DER (Distinguished Encoding Rules)

- 바이너리 형식
- ASN.1 구조를 이진 데이터로 직렬화
- 파일 확장자: `.der`, `.cer`

### PEM (Privacy Enhanced Mail)

- DER을 Base64로 인코딩하고 헤더/푸터를 추가한 텍스트 형식
- 파일 확장자: `.pem`, `.crt`, `.key`
- 텍스트 기반이라 복사/붙여넣기가 쉽고 여러 인증서를 하나의 파일에 연결(concatenate) 가능

```
-----BEGIN CERTIFICATE-----
MIIFazCCBFOgAwIBAgISA0MQ7J4g8OP3Ye9EvJXcYpDDMA0GCSqGSIb3DQEBCwUA
MDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQD
EwJSMzAeFw0yNjAzMDEwMDAwMDBaFw0yNjA1MzAyMzU5NTlaMBkxFzAVBgNVBAMT
... (Base64 인코딩된 데이터) ...
-----END CERTIFICATE-----
```

### 포맷 변환

```bash
# PEM → DER
openssl x509 -in cert.pem -outform DER -out cert.der

# DER → PEM
openssl x509 -in cert.der -inform DER -outform PEM -out cert.pem

# 인증서와 키를 PKCS#12(.pfx/.p12)로 합치기
openssl pkcs12 -export -out bundle.p12 \
    -inkey private.key -in cert.pem -certfile chain.pem

# PKCS#12에서 인증서/키 추출
openssl pkcs12 -in bundle.p12 -clcerts -nokeys -out cert.pem
openssl pkcs12 -in bundle.p12 -nocerts -nodes -out private.key
```

### 자주 사용하는 OpenSSL 명령어

```bash
# 인증서 내용 확인
openssl x509 -in cert.pem -text -noout

# 인증서 유효 기간 확인
openssl x509 -in cert.pem -dates -noout

# 인증서와 개인키 매칭 확인 (modulus 비교)
openssl x509 -in cert.pem -modulus -noout | openssl md5
openssl rsa -in private.key -modulus -noout | openssl md5

# 원격 서버의 인증서 확인
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null | \
    openssl x509 -text -noout

# 인증서 체인 검증
openssl verify -CAfile root.pem -untrusted intermediate.pem cert.pem

# CSR(Certificate Signing Request) 생성
openssl req -new -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 \
    -nodes -keyout private.key -out request.csr \
    -subj "/CN=example.com"
```

## 실무에서의 인증서 관리

### Let's Encrypt와 자동 갱신

Let's Encrypt는 무료 인증서를 자동 발급해주는 CA다. ACME(Automatic Certificate Management Environment) 프로토콜을 사용한다.

```bash
# certbot으로 인증서 발급
sudo certbot certonly --webroot -w /var/www/html -d example.com -d www.example.com

# 자동 갱신 (cron 또는 systemd timer)
sudo certbot renew --quiet

# 인증서 파일 위치
# /etc/letsencrypt/live/example.com/fullchain.pem  (인증서 + 중간 CA)
# /etc/letsencrypt/live/example.com/privkey.pem    (개인키)
```

Let's Encrypt 인증서의 유효 기간은 90일이다. 자동 갱신을 반드시 설정해야 한다. 갱신 실패를 모니터링하는 것도 중요하다.

### Nginx에서의 TLS 설정

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # TLS 1.3만 허용 (또는 1.2 + 1.3)
    ssl_protocols TLSv1.2 TLSv1.3;

    # 강력한 암호 스위트만 허용
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;
    resolver 1.1.1.1 8.8.8.8 valid=300s;

    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
}
```

**주의사항:**
- `ssl_certificate`에는 **서버 인증서 + 중간 CA 인증서**가 포함된 `fullchain.pem`을 지정해야 한다. 서버 인증서만 넣으면 일부 클라이언트에서 검증에 실패한다.
- TLS 1.0과 1.1은 이미 폐기(deprecated)되었으므로 TLS 1.2 이상만 허용한다.

### 인증서 만료 모니터링

인증서 만료는 서비스 장애의 흔한 원인이다. 반드시 모니터링을 설정해야 한다.

```bash
#!/bin/bash
# 인증서 만료일 확인 스크립트

DOMAIN="example.com"
EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | \
    openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

echo "$DOMAIN: ${DAYS_LEFT}일 남음 (만료일: $EXPIRY)"

if [ "$DAYS_LEFT" -lt 30 ]; then
    echo "WARNING: 인증서 만료가 30일 이내입니다!"
    # 알림 전송 (Slack, Email 등)
fi
```

### mTLS (Mutual TLS)

일반적인 TLS에서는 클라이언트만 서버를 검증한다. **mTLS**는 서버도 클라이언트의 인증서를 검증하여 양방향 인증을 수행한다. 마이크로서비스 간 통신, API 게이트웨이, 금융 시스템 등에서 사용된다.

```nginx
# Nginx mTLS 설정
server {
    listen 443 ssl;

    ssl_certificate     /etc/ssl/server.pem;
    ssl_certificate_key /etc/ssl/server.key;

    # 클라이언트 인증서 검증
    ssl_client_certificate /etc/ssl/ca.pem;
    ssl_verify_client on;
    ssl_verify_depth 2;
}
```

### 흔한 문제와 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| 브라우저에서 "인증서를 신뢰할 수 없음" | 중간 CA 인증서 누락 | fullchain.pem 사용 |
| curl에서 "certificate verify failed" | CA 번들 경로 불일치 | `--cacert` 옵션 또는 시스템 CA 번들 업데이트 |
| "certificate has expired" | 인증서 만료 | 갱신 후 서버 재시작 |
| "hostname mismatch" | SAN에 도메인 미포함 | 인증서 재발급 시 SAN에 도메인 추가 |
| Java에서 "PKIX path building failed" | JVM truststore에 CA 없음 | `keytool`로 CA 인증서 추가 |

## 마무리

TLS와 인증서는 현대 인터넷 보안의 근간이다. 단순히 "HTTPS를 설정한다"는 것 이상으로, 핸드셰이크 과정, 키 교환 원리, 인증서 체인 구조를 이해하면 보안 관련 문제를 빠르게 진단하고 해결할 수 있다.

핵심을 요약하면 다음과 같다.

- TLS는 비대칭키로 세션 키를 교환하고, 대칭키로 데이터를 암호화하는 하이브리드 방식이다.
- TLS 1.3은 1-RTT 핸드셰이크와 ECDHE 기반 전방 비밀성을 제공한다.
- X.509 인증서의 신뢰는 Root CA → Intermediate CA → Leaf 인증서로 이어지는 체인에 기반한다.
- 실무에서는 Let's Encrypt 자동 갱신, fullchain 설정, 만료 모니터링이 필수다.
- PEM/DER 포맷 변환과 OpenSSL 명령어는 반드시 익혀두어야 한다.
