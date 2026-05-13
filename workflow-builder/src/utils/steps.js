// Step palette definitions — all available step types
export const STEP_CATEGORIES = [
  {
    id: 'messaging',
    label: 'Messaging',
    color: '#22c55e',
    steps: [
      { stepType: 'send_whatsapp', label: 'Send WhatsApp', icon: '💬', channel: 'whatsapp' },
      { stepType: 'send_rcs', label: 'Send RCS', icon: '📱', channel: 'rcs' },
      { stepType: 'send_sms', label: 'Send SMS', icon: '✉️', channel: 'sms' },
      { stepType: 'send_email', label: 'Send Email', icon: '📧', channel: null },
    ],
  },
  {
    id: 'logic',
    label: 'Logic',
    color: '#f59e0b',
    steps: [
      { stepType: 'condition', label: 'Condition', icon: '🔀' },
      { stepType: 'delay', label: 'Delay', icon: '⏱️' },
      { stepType: 'loop', label: 'Loop', icon: '🔄' },
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
    ],
  },
  {
    id: 'integration',
    label: 'Integration',
    color: '#8b5cf6',
    steps: [
      { stepType: 'webhook', label: 'Webhook', icon: '🔗' },
      { stepType: 'file_upload', label: 'File Upload', icon: '📁' },
      { stepType: 'db_query', label: 'Database Query', icon: '🗄️' },
    ],
  },
  {
    id: 'control',
    label: 'Control',
    color: '#64748b',
    steps: [
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

// Channel filter options
export const CHANNELS = [
  { id: 'all', label: 'All Steps', icon: '📦' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { id: 'rcs', label: 'RCS', icon: '📱' },
  { id: 'sms', label: 'SMS', icon: '✉️' },
];
