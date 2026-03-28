import { useState, useMemo } from 'react';

const SAMPLE_SPEC = JSON.stringify({
  openapi: '3.0.3',
  info: {
    title: 'Pet Store API',
    version: '1.0.0',
    description: 'A sample Pet Store API for demonstrating OpenAPI specifications.',
  },
  servers: [
    { url: 'https://api.petstore.example.com/v1', description: 'Production' },
    { url: 'https://staging-api.petstore.example.com/v1', description: 'Staging' },
  ],
  paths: {
    '/pets': {
      get: {
        tags: ['pets'],
        summary: 'List all pets',
        operationId: 'listPets',
        parameters: [
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', maximum: 100 }, description: 'Maximum number of pets to return' },
          { name: 'offset', in: 'query', required: false, schema: { type: 'integer' }, description: 'Pagination offset' },
        ],
        responses: {
          '200': { description: 'A list of pets', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Pet' } } } } },
          '500': { description: 'Internal server error' },
        },
      },
      post: {
        tags: ['pets'],
        summary: 'Create a pet',
        operationId: 'createPet',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/NewPet' } } },
        },
        responses: {
          '201': { description: 'Pet created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } } },
          '400': { description: 'Invalid input' },
        },
      },
    },
    '/pets/{petId}': {
      get: {
        tags: ['pets'],
        summary: 'Get a pet by ID',
        operationId: 'getPet',
        parameters: [
          { name: 'petId', in: 'path', required: true, schema: { type: 'string' }, description: 'The ID of the pet' },
        ],
        responses: {
          '200': { description: 'A single pet', content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } } },
          '404': { description: 'Pet not found' },
        },
      },
      put: {
        tags: ['pets'],
        summary: 'Update a pet',
        operationId: 'updatePet',
        parameters: [
          { name: 'petId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/NewPet' } } },
        },
        responses: {
          '200': { description: 'Pet updated' },
          '404': { description: 'Pet not found' },
        },
      },
      delete: {
        tags: ['pets'],
        summary: 'Delete a pet',
        operationId: 'deletePet',
        parameters: [
          { name: 'petId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '204': { description: 'Pet deleted' },
          '404': { description: 'Pet not found' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['system'],
        summary: 'Health check endpoint',
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' } } } } } },
        },
      },
    },
  },
  components: {
    schemas: {
      Pet: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique identifier' },
          name: { type: 'string', description: 'Name of the pet' },
          species: { type: 'string', enum: ['dog', 'cat', 'bird', 'fish'] },
          age: { type: 'integer', description: 'Age in years' },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'name', 'species'],
      },
      NewPet: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          species: { type: 'string', enum: ['dog', 'cat', 'bird', 'fish'] },
          age: { type: 'integer' },
        },
        required: ['name', 'species'],
      },
    },
  },
}, null, 2);

type ViewMode = 'editor' | 'split' | 'preview';

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  get: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300' },
  post: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' },
  put: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300' },
  patch: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300' },
  delete: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300' },
};

interface SchemaObj {
  type?: string;
  properties?: Record<string, SchemaObj>;
  items?: SchemaObj;
  required?: string[];
  enum?: string[];
  format?: string;
  description?: string;
  $ref?: string;
  [key: string]: unknown;
}

interface ParameterObj {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  schema?: SchemaObj;
}

interface OperationObj {
  tags?: string[];
  summary?: string;
  operationId?: string;
  parameters?: ParameterObj[];
  requestBody?: { required?: boolean; content?: Record<string, { schema?: SchemaObj }> };
  responses?: Record<string, { description?: string; content?: Record<string, { schema?: SchemaObj }> }>;
}

interface SpecObj {
  openapi?: string;
  info?: { title?: string; version?: string; description?: string };
  servers?: { url: string; description?: string }[];
  paths?: Record<string, Record<string, OperationObj>>;
  components?: { schemas?: Record<string, SchemaObj> };
}

function resolveRef(spec: SpecObj, ref: string): SchemaObj {
  const parts = ref.replace('#/', '').split('/');
  let cur: unknown = spec;
  for (const p of parts) {
    if (cur && typeof cur === 'object') cur = (cur as Record<string, unknown>)[p];
    else return {};
  }
  return (cur as SchemaObj) || {};
}

function resolveSchema(spec: SpecObj, schema: SchemaObj | undefined): SchemaObj {
  if (!schema) return {};
  if (schema.$ref) return resolveRef(spec, schema.$ref);
  return schema;
}

function SchemaView({ spec, schema, depth = 0 }: { spec: SpecObj; schema: SchemaObj | undefined; depth?: number }) {
  const resolved = resolveSchema(spec, schema);
  if (!resolved || Object.keys(resolved).length === 0) return <span className="text-gray-400 text-xs">any</span>;

  if (resolved.type === 'object' && resolved.properties) {
    const req = new Set(resolved.required || []);
    return (
      <div className={depth > 0 ? 'ml-4 border-l border-gray-200 dark:border-gray-700 pl-3' : ''}>
        {Object.entries(resolved.properties).map(([key, val]) => {
          const r = resolveSchema(spec, val);
          return (
            <div key={key} className="py-0.5 text-xs">
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{key}</span>
              {req.has(key) && <span className="text-red-400 ml-0.5">*</span>}
              <span className="text-gray-400 ml-1">
                {r.type || 'object'}
                {r.format ? `(${r.format})` : ''}
                {r.enum ? ` [${r.enum.join(', ')}]` : ''}
              </span>
              {r.description && <span className="text-gray-500 dark:text-gray-400 ml-2">{r.description}</span>}
              {r.type === 'object' && r.properties && <SchemaView spec={spec} schema={r} depth={depth + 1} />}
              {r.type === 'array' && r.items && (
                <div className="ml-4 text-xs text-gray-400">
                  items: <SchemaView spec={spec} schema={r.items} depth={depth + 1} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (resolved.type === 'array' && resolved.items) {
    return (
      <span className="text-xs">
        <span className="text-gray-400">array of </span>
        <SchemaView spec={spec} schema={resolved.items} depth={depth} />
      </span>
    );
  }

  return (
    <span className="text-xs text-gray-400">
      {resolved.type || 'any'}
      {resolved.format ? `(${resolved.format})` : ''}
      {resolved.enum ? ` [${resolved.enum.join(', ')}]` : ''}
    </span>
  );
}

function EndpointCard({ spec, method, path, op }: { spec: SpecObj; method: string; path: string; op: OperationObj }) {
  const [open, setOpen] = useState(false);
  const colors = METHOD_COLORS[method] || METHOD_COLORS.get;
  const bodySchema = op.requestBody?.content?.['application/json']?.schema;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className={`${colors.bg} ${colors.text} px-2 py-0.5 rounded text-xs font-bold uppercase font-mono min-w-[56px] text-center`}>
          {method}
        </span>
        <span className="font-mono text-sm text-gray-900 dark:text-white">{path}</span>
        {op.summary && <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto truncate max-w-[40%]">{op.summary}</span>}
        <span className="text-gray-400 text-xs ml-2">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-3 bg-gray-50/50 dark:bg-gray-800/30">
          {op.operationId && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Operation ID:</span>{' '}
              <span className="font-mono">{op.operationId}</span>
            </div>
          )}

          {op.parameters && op.parameters.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Parameters</h4>
              <div className="space-y-1">
                {op.parameters.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{p.name}</span>
                    {p.required && <span className="text-red-400">*</span>}
                    <span className="text-gray-400">({p.in})</span>
                    {p.schema && <span className="text-gray-400">{p.schema.type}</span>}
                    {p.description && <span className="text-gray-500 dark:text-gray-400">{p.description}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {bodySchema && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Request Body</h4>
              <div className="bg-white dark:bg-gray-900 rounded p-2 border border-gray-100 dark:border-gray-700">
                <SchemaView spec={spec} schema={bodySchema} />
              </div>
            </div>
          )}

          {op.responses && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Responses</h4>
              <div className="space-y-1.5">
                {Object.entries(op.responses).map(([code, resp]) => {
                  const respSchema = resp.content?.['application/json']?.schema;
                  return (
                    <div key={code} className="bg-white dark:bg-gray-900 rounded p-2 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`font-mono font-bold ${code.startsWith('2') ? 'text-green-600' : code.startsWith('4') ? 'text-amber-600' : code.startsWith('5') ? 'text-red-600' : 'text-gray-500'}`}>
                          {code}
                        </span>
                        <span className="text-gray-500">{resp.description}</span>
                      </div>
                      {respSchema && (
                        <div className="mt-1">
                          <SchemaView spec={spec} schema={respSchema} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SpecPreview({ spec }: { spec: SpecObj }) {
  const grouped = useMemo(() => {
    const groups: Record<string, { method: string; path: string; op: OperationObj }[]> = {};
    const paths = spec.paths || {};
    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, op] of Object.entries(methods)) {
        if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)) {
          const tag = op.tags?.[0] || 'default';
          if (!groups[tag]) groups[tag] = [];
          groups[tag].push({ method, path, op });
        }
      }
    }
    return groups;
  }, [spec]);

  return (
    <div className="space-y-6 overflow-y-auto h-full p-4">
      {/* Info */}
      {spec.info && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {spec.info.title || 'Untitled API'}
            {spec.info.version && (
              <span className="ml-2 text-xs font-normal bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                v{spec.info.version}
              </span>
            )}
          </h2>
          {spec.openapi && <p className="text-xs text-gray-400 mt-1">OpenAPI {spec.openapi}</p>}
          {spec.info.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{spec.info.description}</p>}
        </div>
      )}

      {/* Servers */}
      {spec.servers && spec.servers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Servers</h3>
          <div className="space-y-1">
            {spec.servers.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{s.url}</span>
                {s.description && <span className="text-gray-400">— {s.description}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Endpoints */}
      {Object.entries(grouped).map(([tag, endpoints]) => (
        <div key={tag}>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 capitalize">{tag}</h3>
          <div className="space-y-2">
            {endpoints.map((ep, i) => (
              <EndpointCard key={i} spec={spec} method={ep.method} path={ep.path} op={ep.op} />
            ))}
          </div>
        </div>
      ))}

      {/* Schemas */}
      {spec.components?.schemas && Object.keys(spec.components.schemas).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Schemas</h3>
          <div className="space-y-3">
            {Object.entries(spec.components.schemas).map(([name, schema]) => (
              <div key={name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h4 className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">{name}</h4>
                <SchemaView spec={spec} schema={schema} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OpenApiViewer() {
  const [input, setInput] = useState(SAMPLE_SPEC);
  const [mode, setMode] = useState<ViewMode>('split');

  const parsed = useMemo(() => {
    try {
      const spec = JSON.parse(input) as SpecObj;
      return { spec, error: null };
    } catch (e) {
      return { spec: null, error: (e as Error).message };
    }
  }, [input]);

  const modeButtons: { key: ViewMode; label: string }[] = [
    { key: 'editor', label: 'Editor' },
    { key: 'split', label: 'Split' },
    { key: 'preview', label: 'Preview' },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {modeButtons.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === m.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setInput(SAMPLE_SPEC)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Sample
          </button>
          <button
            onClick={() => setInput('')}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400">JSON format only. YAML support coming soon.</p>

      {/* Main area */}
      <div className="flex gap-4" style={{ minHeight: '600px' }}>
        {/* Editor */}
        {mode !== 'preview' && (
          <div className={mode === 'split' ? 'w-1/2' : 'w-full'}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              className="w-full h-full min-h-[600px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm p-4 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Paste your OpenAPI JSON spec here..."
            />
          </div>
        )}

        {/* Preview */}
        {mode !== 'editor' && (
          <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden`}>
            {parsed.error ? (
              <div className="p-4 text-sm text-red-500 font-mono">{parsed.error}</div>
            ) : parsed.spec ? (
              <SpecPreview spec={parsed.spec} />
            ) : (
              <div className="p-4 text-sm text-gray-400">Enter a valid OpenAPI JSON spec to preview.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
