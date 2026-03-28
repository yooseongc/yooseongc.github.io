import { useState, useMemo } from 'react';

// Itanium C++ ABI Demangler
// Reference: https://itanium-cxx-abi.github.io/cxx-abi/abi.html#mangling

const BUILTIN_TYPES: Record<string, string> = {
  v: 'void', w: 'wchar_t', b: 'bool', c: 'char', a: 'signed char',
  h: 'unsigned char', s: 'short', t: 'unsigned short', i: 'int',
  j: 'unsigned int', l: 'long', m: 'unsigned long', x: 'long long',
  y: 'unsigned long long', n: '__int128', o: 'unsigned __int128',
  f: 'float', d: 'double', e: 'long double', g: '__float128',
  z: '...', Dn: 'decltype(nullptr)', Di: 'char32_t', Ds: 'char16_t',
  Da: 'auto', Dc: 'decltype(auto)',
};

const OPERATOR_NAMES: Record<string, string> = {
  nw: 'operator new', na: 'operator new[]', dl: 'operator delete',
  da: 'operator delete[]', ps: 'operator+', ng: 'operator-',
  ad: 'operator&', de: 'operator*', co: 'operator~', pl: 'operator+',
  mi: 'operator-', ml: 'operator*', dv: 'operator/', rm: 'operator%',
  an: 'operator&', or: 'operator|', eo: 'operator^', aS: 'operator=',
  pL: 'operator+=', mI: 'operator-=', mL: 'operator*=', dV: 'operator/=',
  rM: 'operator%=', aN: 'operator&=', oR: 'operator|=', eO: 'operator^=',
  ls: 'operator<<', rs: 'operator>>', lS: 'operator<<=', rS: 'operator>>=',
  eq: 'operator==', ne: 'operator!=', lt: 'operator<', gt: 'operator>',
  le: 'operator<=', ge: 'operator>=', ss: 'operator<=>', nt: 'operator!',
  aa: 'operator&&', oo: 'operator||', pp: 'operator++', mm: 'operator--',
  cm: 'operator,', pm: 'operator->*', pt: 'operator->', cl: 'operator()',
  ix: 'operator[]', qu: 'operator?', cv: 'operator (conversion)',
};

class Demangler {
  private input: string;
  private pos: number;
  private substitutions: string[];

  constructor(mangled: string) {
    this.input = mangled;
    this.pos = 0;
    this.substitutions = [];
  }

  private peek(n = 1): string {
    return this.input.substring(this.pos, this.pos + n);
  }

  private consume(n = 1): string {
    const s = this.input.substring(this.pos, this.pos + n);
    this.pos += n;
    return s;
  }

  private remaining(): string {
    return this.input.substring(this.pos);
  }

  private addSubstitution(s: string): void {
    if (!this.substitutions.includes(s)) {
      this.substitutions.push(s);
    }
  }

  demangle(): string {
    if (!this.input.startsWith('_Z')) {
      return this.input; // Not a mangled name, return as-is
    }
    this.consume(2); // _Z
    try {
      return this.parseEncoding();
    } catch {
      return this.input; // Fallback to original on error
    }
  }

  private parseEncoding(): string {
    const name = this.parseName();
    if (this.pos >= this.input.length) return name;

    // Try to parse function signature
    const params = this.parseBareFunctionType();
    if (params) return `${name}(${params})`;
    return name;
  }

  private parseName(): string {
    if (this.peek() === 'N') return this.parseNestedName();
    if (this.peek() === 'Z') return this.parseLocalName();

    // Unscoped name
    const name = this.parseUnqualifiedName();
    if (this.peek() === 'I') {
      const targs = this.parseTemplateArgs();
      const full = `${name}${targs}`;
      this.addSubstitution(full);
      return full;
    }
    return name;
  }

  private parseNestedName(): string {
    this.consume(1); // N

    // CV qualifiers
    let cvPrefix = '';
    while (this.peek() === 'K' || this.peek() === 'V' || this.peek() === 'r') {
      if (this.peek() === 'K') { cvPrefix += ' const'; this.consume(1); }
      else if (this.peek() === 'V') { cvPrefix += ' volatile'; this.consume(1); }
      else if (this.peek() === 'r') { cvPrefix += ' restrict'; this.consume(1); }
    }

    const parts: string[] = [];
    while (this.peek() !== 'E' && this.pos < this.input.length) {
      if (this.peek() === 'I') {
        const targs = this.parseTemplateArgs();
        if (parts.length > 0) {
          parts[parts.length - 1] += targs;
          this.addSubstitution(parts.join('::'));
        }
      } else if (this.peek() === 'S') {
        const sub = this.parseSubstitution();
        parts.push(sub);
      } else if (this.peek() === 'D' && this.peek(2) === 'D1' || this.peek(2) === 'D2' || this.peek(2) === 'D0') {
        this.consume(2);
        parts.push(`~${parts[parts.length - 1] || 'unknown'}`);
      } else if (this.peek() === 'C' && '012'.includes(this.peek(2)[1] || '')) {
        this.consume(2); // C1, C2, C3
        if (parts.length > 0) parts.push(parts[parts.length - 1]);
        else parts.push('constructor');
      } else {
        const name = this.parseUnqualifiedName();
        parts.push(name);
        this.addSubstitution(parts.join('::'));
      }
    }
    if (this.peek() === 'E') this.consume(1);

    return parts.join('::') + cvPrefix;
  }

  private parseLocalName(): string {
    this.consume(1); // Z
    const encoding = this.parseEncoding();
    if (this.peek() === 'E') {
      this.consume(1);
      if (this.peek() === 's') {
        this.consume(1);
        return `${encoding}::{string literal}`;
      }
      const name = this.parseName();
      return `${encoding}::${name}`;
    }
    return encoding;
  }

  private parseUnqualifiedName(): string {
    const c = this.peek();
    if (c >= '0' && c <= '9') return this.parseSourceName();
    if (c === 'C' && '0123'.includes(this.peek(2)[1] || '')) {
      this.consume(2);
      return '{constructor}';
    }
    if (c === 'D' && '0123'.includes(this.peek(2)[1] || '')) {
      this.consume(2);
      return '{destructor}';
    }
    if (this.peek(2) in OPERATOR_NAMES) {
      const op = this.consume(2);
      if (op === 'cv') {
        const type = this.parseType();
        return `operator ${type}`;
      }
      return OPERATOR_NAMES[op];
    }
    if (c === 'L') {
      this.consume(1);
      return this.parseSourceName();
    }
    // Unknown, try reading as source name
    return this.parseSourceName();
  }

  private parseSourceName(): string {
    let numStr = '';
    while (this.pos < this.input.length && this.peek() >= '0' && this.peek() <= '9') {
      numStr += this.consume(1);
    }
    const len = parseInt(numStr, 10);
    if (isNaN(len) || len <= 0) throw new Error('Invalid source name length');
    return this.consume(len);
  }

  private parseType(): string {
    const c = this.peek();

    // Builtin types
    if (c === 'D' && this.peek(2).length === 2) {
      const two = this.peek(2);
      if (BUILTIN_TYPES[two]) { this.consume(2); return BUILTIN_TYPES[two]; }
    }
    if (BUILTIN_TYPES[c]) { this.consume(1); return BUILTIN_TYPES[c]; }

    // Pointer
    if (c === 'P') { this.consume(1); const t = this.parseType(); this.addSubstitution(`${t}*`); return `${t}*`; }
    // Reference
    if (c === 'R') { this.consume(1); const t = this.parseType(); this.addSubstitution(`${t}&`); return `${t}&`; }
    // Rvalue reference
    if (c === 'O') { this.consume(1); const t = this.parseType(); this.addSubstitution(`${t}&&`); return `${t}&&`; }
    // Const
    if (c === 'K') { this.consume(1); const t = this.parseType(); return `${t} const`; }
    // Volatile
    if (c === 'V') { this.consume(1); const t = this.parseType(); return `${t} volatile`; }

    // Array
    if (c === 'A') {
      this.consume(1);
      let dim = '';
      while (this.peek() !== '_' && this.pos < this.input.length) dim += this.consume(1);
      this.consume(1); // _
      const t = this.parseType();
      return `${t}[${dim}]`;
    }

    // Function type
    if (c === 'F') {
      this.consume(1);
      const ret = this.parseType();
      const params: string[] = [];
      while (this.peek() !== 'E' && this.pos < this.input.length) {
        params.push(this.parseType());
      }
      if (this.peek() === 'E') this.consume(1);
      return `${ret} (${params.join(', ')})`;
    }

    // Nested name (class type)
    if (c === 'N') {
      const name = this.parseNestedName();
      this.addSubstitution(name);
      return name;
    }

    // Substitution
    if (c === 'S') {
      return this.parseSubstitution();
    }

    // Template parameter
    if (c === 'T') {
      this.consume(1);
      if (this.peek() === '_') { this.consume(1); return 'T'; }
      let idx = '';
      while (this.peek() !== '_' && this.pos < this.input.length) idx += this.consume(1);
      if (this.peek() === '_') this.consume(1);
      return `T${parseInt(idx, 36) + 1}`;
    }

    // Source name (class name)
    if (c >= '0' && c <= '9') {
      const name = this.parseSourceName();
      this.addSubstitution(name);
      if (this.peek() === 'I') {
        const targs = this.parseTemplateArgs();
        const full = `${name}${targs}`;
        this.addSubstitution(full);
        return full;
      }
      return name;
    }

    // Decltype
    if (this.peek(2) === 'Dt' || this.peek(2) === 'DT') {
      this.consume(2);
      // Skip expression
      let depth = 0;
      let expr = '';
      while (this.pos < this.input.length) {
        if (this.peek() === 'E' && depth === 0) { this.consume(1); break; }
        expr += this.consume(1);
      }
      return `decltype(${expr})`;
    }

    // Unknown - consume one char and mark as unknown
    const ch = this.consume(1);
    return `{unknown:${ch}}`;
  }

  private parseTemplateArgs(): string {
    if (this.peek() !== 'I') return '';
    this.consume(1); // I
    const args: string[] = [];
    while (this.peek() !== 'E' && this.pos < this.input.length) {
      // Template arg can be a type or expression (simplified: treat as type)
      if (this.peek() === 'X') {
        this.consume(1);
        // Expression - skip to E
        let depth = 0;
        let expr = '';
        while (this.pos < this.input.length) {
          if (this.peek() === 'E' && depth === 0) { this.consume(1); break; }
          expr += this.consume(1);
        }
        args.push(`{expr}`);
      } else if (this.peek() === 'L') {
        // Literal
        this.consume(1);
        const type = this.parseType();
        let val = '';
        while (this.peek() !== 'E' && this.pos < this.input.length) val += this.consume(1);
        if (this.peek() === 'E') this.consume(1);
        args.push(`(${type})${val}`);
      } else if (this.peek() === 'J') {
        // Argument pack
        this.consume(1);
        while (this.peek() !== 'E' && this.pos < this.input.length) {
          args.push(this.parseType());
        }
        if (this.peek() === 'E') this.consume(1);
      } else {
        args.push(this.parseType());
      }
    }
    if (this.peek() === 'E') this.consume(1);
    return `<${args.join(', ')}>`;
  }

  private parseSubstitution(): string {
    this.consume(1); // S

    // Well-known substitutions
    if (this.peek() === 't') { this.consume(1); return 'std'; }
    if (this.peek() === 'a') { this.consume(1); return 'std::allocator'; }
    if (this.peek() === 'b') { this.consume(1); return 'std::basic_string'; }
    if (this.peek() === 's') { this.consume(1); return 'std::string'; }
    if (this.peek() === 'i') { this.consume(1); return 'std::istream'; }
    if (this.peek() === 'o') { this.consume(1); return 'std::ostream'; }
    if (this.peek() === 'd') { this.consume(1); return 'std::iostream'; }

    if (this.peek() === '_') {
      this.consume(1);
      return this.substitutions[0] || '{S_}';
    }

    // S<seq-id>_ : base-36 index + 1
    let seqStr = '';
    while (this.peek() !== '_' && this.pos < this.input.length) {
      seqStr += this.consume(1);
    }
    if (this.peek() === '_') this.consume(1);
    const idx = parseInt(seqStr, 36) + 1;
    return this.substitutions[idx] || `{S${seqStr}_}`;
  }

  private parseBareFunctionType(): string | null {
    if (this.pos >= this.input.length) return null;
    const params: string[] = [];
    try {
      while (this.pos < this.input.length) {
        params.push(this.parseType());
      }
    } catch {
      // End of parsing
    }
    if (params.length === 0) return null;
    if (params.length === 1 && params[0] === 'void') return '';
    return params.join(', ');
  }
}

function demangleSymbol(mangled: string): string {
  const trimmed = mangled.trim();
  if (!trimmed) return '';
  if (!trimmed.startsWith('_Z')) return trimmed;
  try {
    const d = new Demangler(trimmed);
    return d.demangle();
  } catch {
    return `(failed to demangle: ${trimmed})`;
  }
}

const SAMPLE_SYMBOLS = [
  '_ZN5MyApp6Widget8setColorERKi',
  '_ZN3std6vectorIiSaIiEE9push_backERKi',
  '_ZN6MyMath3addIiEET_S1_S1_',
  '_Z8multiplyii',
  '_ZNK5Shape4areaEv',
  '_ZN7MyClass10MySubClass6methodEidf',
  '_ZN3FooD1Ev',
  '_ZN3Bar3bazIPKcEEvT_',
  '_Z3foov',
  '_ZNSt6vectorIdSaIdEE5beginEv',
  '_ZN5boost8optionalIiE5resetEv',
  '_ZN4util10StringViewC1EPKcm',
  '_ZN12_GLOBAL__N_16helperEi',
  '_ZNK8Compiler8Analyzer12getTokenListEv',
  '_Z7processRKSs',
];

export function CppDemangler() {
  const [input, setInput] = useState('');
  const [bulkMode, setBulkMode] = useState(false);

  const results = useMemo(() => {
    if (!input.trim()) return [];
    if (bulkMode) {
      return input.split('\n').filter((l) => l.trim()).map((l) => {
        const mangled = l.trim();
        return { mangled, demangled: demangleSymbol(mangled) };
      });
    }
    const mangled = input.trim();
    return [{ mangled, demangled: demangleSymbol(mangled) }];
  }, [input, bulkMode]);

  const loadSamples = () => {
    setBulkMode(true);
    setInput(SAMPLE_SYMBOLS.join('\n'));
  };

  return (
    <div className="space-y-6">
      {/* Mode & actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setBulkMode(false)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              !bulkMode
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Single
          </button>
          <button
            onClick={() => setBulkMode(true)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              bulkMode
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Bulk
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadSamples}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors"
          >
            Load Samples
          </button>
          <button
            onClick={() => setInput('')}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {bulkMode ? 'Mangled Symbols (one per line)' : 'Mangled Symbol'}
        </label>
        {bulkMode ? (
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"_ZN5MyApp6Widget8setColorERKi\n_Z8multiplyii\n..."}
            rows={8}
            spellCheck={false}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm p-4 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        ) : (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="_ZN5MyApp6Widget8setColorERKi"
            spellCheck={false}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Results</h3>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Mangled</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Demangled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400 break-all max-w-[40%]">
                      {r.mangled}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-emerald-700 dark:text-emerald-300 break-all">
                      {r.demangled}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reference */}
      <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Itanium ABI Mangling Reference</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Structure</h4>
            <div className="font-mono space-y-0.5">
              <div><span className="text-emerald-600 dark:text-emerald-400">_Z</span> = mangled prefix</div>
              <div><span className="text-emerald-600 dark:text-emerald-400">N...E</span> = nested name</div>
              <div><span className="text-emerald-600 dark:text-emerald-400">I...E</span> = template args</div>
              <div><span className="text-emerald-600 dark:text-emerald-400">&lt;num&gt;&lt;name&gt;</span> = source name</div>
              <div><span className="text-emerald-600 dark:text-emerald-400">C1/C2</span> = constructor</div>
              <div><span className="text-emerald-600 dark:text-emerald-400">D0/D1/D2</span> = destructor</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Type Codes</h4>
            <div className="font-mono space-y-0.5">
              <div><span className="text-emerald-600 dark:text-emerald-400">v</span>=void <span className="text-emerald-600 dark:text-emerald-400">b</span>=bool <span className="text-emerald-600 dark:text-emerald-400">c</span>=char <span className="text-emerald-600 dark:text-emerald-400">i</span>=int</div>
              <div><span className="text-emerald-600 dark:text-emerald-400">l</span>=long <span className="text-emerald-600 dark:text-emerald-400">f</span>=float <span className="text-emerald-600 dark:text-emerald-400">d</span>=double <span className="text-emerald-600 dark:text-emerald-400">s</span>=short</div>
              <div><span className="text-emerald-600 dark:text-emerald-400">P</span>=pointer <span className="text-emerald-600 dark:text-emerald-400">R</span>=reference <span className="text-emerald-600 dark:text-emerald-400">O</span>=rvalue ref</div>
              <div><span className="text-emerald-600 dark:text-emerald-400">K</span>=const <span className="text-emerald-600 dark:text-emerald-400">V</span>=volatile</div>
              <div><span className="text-emerald-600 dark:text-emerald-400">S_</span>=first substitution</div>
              <div><span className="text-emerald-600 dark:text-emerald-400">St</span>=std:: <span className="text-emerald-600 dark:text-emerald-400">Ss</span>=std::string</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
