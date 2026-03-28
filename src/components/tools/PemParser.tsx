import { useState } from 'react';

interface CertInfo {
  subject: Record<string, string>;
  issuer: Record<string, string>;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  algorithm: string;
  fingerprint: string;
  isCA: boolean;
  keyUsage: string[];
  sanList: string[];
  version: number;
  raw: string;
}

const OID_MAP: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '1.2.840.113549.1.1.1': 'RSA',
  '1.2.840.113549.1.1.5': 'SHA-1 with RSA',
  '1.2.840.113549.1.1.11': 'SHA-256 with RSA',
  '1.2.840.113549.1.1.12': 'SHA-384 with RSA',
  '1.2.840.113549.1.1.13': 'SHA-512 with RSA',
  '1.2.840.10045.4.3.2': 'ECDSA with SHA-256',
  '1.2.840.10045.4.3.3': 'ECDSA with SHA-384',
};

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join(':');
}

async function sha256Fingerprint(der: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', der);
  return bytesToHex(new Uint8Array(hash)).toUpperCase();
}

// Minimal ASN.1 DER parser
interface ASN1Node {
  tag: number;
  constructed: boolean;
  data: Uint8Array;
  children: ASN1Node[];
  offset: number;
}

function parseASN1(data: Uint8Array, offset = 0): ASN1Node[] {
  const nodes: ASN1Node[] = [];
  let pos = offset;
  while (pos < data.length) {
    if (pos >= data.length) break;
    const tag = data[pos++];
    if (tag === 0 && pos < data.length && data[pos] === 0) break;
    let len = data[pos++];
    if (len & 0x80) {
      const numBytes = len & 0x7F;
      len = 0;
      for (let i = 0; i < numBytes; i++) {
        len = (len << 8) | data[pos++];
      }
    }
    const nodeData = data.slice(pos, pos + len);
    const constructed = !!(tag & 0x20);
    const node: ASN1Node = { tag, constructed, data: nodeData, children: [], offset: pos };
    if (constructed && len > 0) {
      try { node.children = parseASN1(nodeData); } catch { /* skip */ }
    }
    nodes.push(node);
    pos += len;
  }
  return nodes;
}

function decodeOID(data: Uint8Array): string {
  if (data.length === 0) return '';
  const parts: number[] = [Math.floor(data[0] / 40), data[0] % 40];
  let val = 0;
  for (let i = 1; i < data.length; i++) {
    val = (val << 7) | (data[i] & 0x7F);
    if (!(data[i] & 0x80)) { parts.push(val); val = 0; }
  }
  return parts.join('.');
}

function decodeUTF8(data: Uint8Array): string {
  return new TextDecoder().decode(data);
}

function parseName(node: ASN1Node): Record<string, string> {
  const result: Record<string, string> = {};
  for (const set of node.children) {
    for (const seq of set.children) {
      if (seq.children.length >= 2) {
        const oid = decodeOID(seq.children[0].data);
        const name = OID_MAP[oid] || oid;
        const value = decodeUTF8(seq.children[1].data);
        result[name] = value;
      }
    }
  }
  return result;
}

function parseTime(node: ASN1Node): string {
  const str = decodeUTF8(node.data);
  if (node.tag === 0x17) { // UTCTime
    const year = parseInt(str.slice(0, 2));
    const fullYear = year >= 50 ? 1900 + year : 2000 + year;
    return `${fullYear}-${str.slice(2, 4)}-${str.slice(4, 6)} ${str.slice(6, 8)}:${str.slice(8, 10)}:${str.slice(10, 12)} UTC`;
  }
  // GeneralizedTime
  return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)} ${str.slice(8, 10)}:${str.slice(10, 12)}:${str.slice(12, 14)} UTC`;
}

async function parsePEM(pem: string): Promise<CertInfo> {
  const b64 = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s/g, '');
  const binary = atob(b64);
  const der = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) der[i] = binary.charCodeAt(i);

  const fingerprint = await sha256Fingerprint(der.buffer);
  const root = parseASN1(der);
  if (!root.length) throw new Error('ASN.1 파싱 실패');

  const cert = root[0]; // SEQUENCE
  const tbs = cert.children[0]; // TBSCertificate

  let idx = 0;
  // version (explicit tag [0])
  let version = 1;
  if (tbs.children[idx] && (tbs.children[idx].tag & 0x1F) === 0) {
    const vNode = tbs.children[idx].children[0];
    version = (vNode?.data[0] ?? 0) + 1;
    idx++;
  }

  // serialNumber
  const serialNumber = bytesToHex(tbs.children[idx]?.data ?? new Uint8Array()).toUpperCase();
  idx++;

  // signature algorithm
  const sigAlgOid = tbs.children[idx]?.children[0] ? decodeOID(tbs.children[idx].children[0].data) : '';
  const algorithm = OID_MAP[sigAlgOid] || sigAlgOid;
  idx++;

  // issuer
  const issuer = parseName(tbs.children[idx] ?? { children: [] } as ASN1Node);
  idx++;

  // validity
  const validity = tbs.children[idx];
  const validFrom = validity?.children[0] ? parseTime(validity.children[0]) : '';
  const validTo = validity?.children[1] ? parseTime(validity.children[1]) : '';
  idx++;

  // subject
  const subject = parseName(tbs.children[idx] ?? { children: [] } as ASN1Node);

  return {
    subject,
    issuer,
    validFrom,
    validTo,
    serialNumber,
    algorithm,
    fingerprint,
    isCA: false,
    keyUsage: [],
    sanList: [],
    version,
    raw: b64.slice(0, 60) + '...',
  };
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 gap-4">
      <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span className="text-sm font-mono text-gray-900 dark:text-gray-100 text-right break-all">{value}</span>
    </div>
  );
}

function NameSection({ title, name }: { title: string; name: Record<string, string> }) {
  const entries = Object.entries(name);
  if (entries.length === 0) return null;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      {entries.map(([k, v]) => (
        <InfoRow key={k} label={k} value={v} />
      ))}
    </div>
  );
}

const SAMPLE_PEM = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJALxL+vGSMQJ4MA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMMBnNh
bXBsZTAeFw0yNDAzMjgwMDAwMDBaFw0yNTAzMjgwMDAwMDBaMBExDzANBgNVBAMM
BnNhbXBsZTBcMA0GCSqGSIb3DQEBAQUAA0sAMEgCQQC7o96QcGEm6VY2WQBQ/GRO
aJqnqhTLEz+M7RfmaJpLbPDYDU8PpWME7MRoLGvIEuqAvPjFv6bDwlYJxkC1RH1A
gMBAAEwDQYJKoZIhvcNAQELBQADQQBE7LGLl5GYnKPtGHaAi3mP5jHmU8hDSBRr
jkyB+bGAFMlCxEJkFbRLfRLIY8Ue6q7vXm1U6NDUXM5kf1cKXbF
-----END CERTIFICATE-----`;

export function PemParser() {
  const [input, setInput] = useState('');
  const [certInfo, setCertInfo] = useState<CertInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleParse() {
    setError('');
    setCertInfo(null);
    const text = input.trim();
    if (!text) { setError('PEM 데이터를 입력하세요.'); return; }
    if (!text.includes('-----BEGIN')) { setError('유효한 PEM 형식이 아닙니다.'); return; }
    setLoading(true);
    try {
      const info = await parsePEM(text);
      setCertInfo(info);
    } catch (e) {
      setError(e instanceof Error ? e.message : '파싱에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function handleSample() {
    setInput(SAMPLE_PEM);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">PEM Certificate</label>
          <button onClick={handleSample} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
            샘플 로드
          </button>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
          className="w-full h-48 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      <button
        onClick={handleParse}
        disabled={loading}
        className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
      >
        {loading ? '파싱 중...' : '파싱'}
      </button>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      {certInfo && (
        <div className="grid sm:grid-cols-2 gap-4">
          <NameSection title="Subject" name={certInfo.subject} />
          <NameSection title="Issuer" name={certInfo.issuer} />

          <div className="sm:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">인증서 정보</h3>
            <InfoRow label="Version" value={`V${certInfo.version}`} />
            <InfoRow label="Serial Number" value={certInfo.serialNumber} />
            <InfoRow label="Algorithm" value={certInfo.algorithm} />
            <InfoRow label="Valid From" value={certInfo.validFrom} />
            <InfoRow label="Valid To" value={certInfo.validTo} />
            <InfoRow label="SHA-256 Fingerprint" value={certInfo.fingerprint} />
          </div>
        </div>
      )}
    </div>
  );
}
