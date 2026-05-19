// Step palette definitions — file processing focused
export const STEP_CATEGORIES = [
  {
    id: 'file',
    label: 'File Processing',
    color: '#8b5cf6',
    steps: [
      { stepType: 'file_upload', label: 'File Upload', icon: '📁' },
      { stepType: 'file_read', label: 'Read File', icon: '📖' },
      { stepType: 'file_write', label: 'Write File', icon: '💾' },
      { stepType: 'file_convert', label: 'Convert Format', icon: '🔄' },
      { stepType: 'file_parse', label: 'Parse (CSV/JSON/XML)', icon: '🗂️' },
      { stepType: 'file_compress', label: 'Compress / Zip', icon: '📦' },
      { stepType: 'file_merge', label: 'Merge Files', icon: '🔗' },
      { stepType: 'file_split', label: 'Split File', icon: '✂️' },
      { stepType: 'file_delete', label: 'Delete File', icon: '🗑️' },
    ],
  },
  {
    id: 'logic',
    label: 'Logic',
    color: '#f59e0b',
    steps: [
      { stepType: 'condition', label: 'Condition', icon: '🔀' },
      { stepType: 'delay', label: 'Delay', icon: '⏱️' },
      { stepType: 'loop', label: 'Loop', icon: '🔁' },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    color: '#3b82f6',
    steps: [
      { stepType: 'http_request', label: 'HTTP Request', icon: '🌐' },
      { stepType: 'transform', label: 'Transform Data', icon: '🔧' },
      { stepType: 'set_variable', label: 'Set Variable', icon: '📝' },
      { stepType: 'db_query', label: 'Database Query', icon: '🗄️' },
    ],
  },
  {
    id: 'integration',
    label: 'Integration',
    color: '#06b6d4',
    steps: [
      { stepType: 'webhook', label: 'Webhook', icon: '🔗' },
      { stepType: 'ftp_transfer', label: 'FTP Transfer', icon: '📡' },
      { stepType: 's3_upload', label: 'S3 Upload', icon: '☁️' },
      { stepType: 's3_download', label: 'S3 Download', icon: '⬇️' },
    ],
  },
  {
    id: 'control',
    label: 'Control',
    color: '#64748b',
    steps: [
      { stepType: 'start', label: 'Start', icon: '▶️' },
      { stepType: 'end', label: 'End', icon: '🏁' },
      { stepType: 'error_handler', label: 'Error Handler', icon: '⚠️' },
    ],
  },
];

// Flatten for lookup
export const ALL_STEPS = STEP_CATEGORIES.flatMap(cat =>
  cat.steps.map(s => ({ ...s, category: cat.id, categoryColor: cat.color }))
);

export function getStepMeta(stepType) {
  return ALL_STEPS.find(s => s.stepType === stepType) || {
    stepType,
    label: stepType,
    icon: '❓',
    category: 'control',
    categoryColor: '#64748b',
  };
}
