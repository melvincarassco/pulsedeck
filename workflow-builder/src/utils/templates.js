// Built-in workflow templates
export const TEMPLATES = [
  {
    name: 'Welcome Message Flow',
    description: 'Send a welcome WhatsApp message, wait, then follow up via SMS.',
    data: {
      workflowName: 'Welcome Message Flow',
      version: '1.0',
      savedAt: null,
      canvas: {
        nodes: [
          { id: 's1', type: 'step', position: { x: 300, y: 200 }, data: { label: 'Send WhatsApp', stepType: 'send_whatsapp', category: 'messaging', icon: '💬', channel: 'whatsapp', config: { message: 'Welcome! Thanks for joining.' } } },
          { id: 's2', type: 'step', position: { x: 580, y: 200 }, data: { label: 'Wait 24h', stepType: 'delay', category: 'logic', icon: '⏱️', config: { duration: '24h' } } },
          { id: 's3', type: 'step', position: { x: 860, y: 200 }, data: { label: 'Follow-up SMS', stepType: 'send_sms', category: 'messaging', icon: '✉️', channel: 'sms', config: { message: 'Hi! Did you get our WhatsApp message?' } } },
        ],
        edges: [
          { id: 'e-s1-s2', source: 's1', target: 's2' },
          { id: 'e-s2-s3', source: 's2', target: 's3' },
        ],
      },
      parameters: { campaign: 'onboarding' },
    },
  },
  {
    name: 'API Data Pipeline',
    description: 'Fetch data from an API, transform it, then send via webhook.',
    data: {
      workflowName: 'API Data Pipeline',
      version: '1.0',
      savedAt: null,
      canvas: {
        nodes: [
          { id: 's1', type: 'step', position: { x: 300, y: 200 }, data: { label: 'Fetch API', stepType: 'http_request', category: 'data', icon: '🌐', config: { url: 'https://api.example.com/data', method: 'GET' } } },
          { id: 's2', type: 'step', position: { x: 580, y: 200 }, data: { label: 'Transform', stepType: 'transform', category: 'data', icon: '🔧', config: { expression: 'data.map(d => d.name)' } } },
          { id: 's3', type: 'step', position: { x: 860, y: 200 }, data: { label: 'Send Webhook', stepType: 'webhook', category: 'integration', icon: '🔗', config: { url: 'https://hooks.example.com/receive' } } },
        ],
        edges: [
          { id: 'e-s1-s2', source: 's1', target: 's2' },
          { id: 'e-s2-s3', source: 's2', target: 's3' },
        ],
      },
      parameters: { env: 'production' },
    },
  },
  {
    name: 'Conditional Messaging',
    description: 'Check a condition, then branch to WhatsApp or RCS.',
    data: {
      workflowName: 'Conditional Messaging',
      version: '1.0',
      savedAt: null,
      canvas: {
        nodes: [
          { id: 's1', type: 'step', position: { x: 300, y: 200 }, data: { label: 'Set Variable', stepType: 'set_variable', category: 'data', icon: '📝', config: { name: 'channel_pref', value: 'whatsapp' } } },
          { id: 's2', type: 'step', position: { x: 580, y: 200 }, data: { label: 'Check Preference', stepType: 'condition', category: 'logic', icon: '🔀', config: { condition: 'channel_pref === "whatsapp"' } } },
          { id: 's3', type: 'step', position: { x: 860, y: 120 }, data: { label: 'Send WhatsApp', stepType: 'send_whatsapp', category: 'messaging', icon: '💬', channel: 'whatsapp', config: { message: 'Hello via WhatsApp!' } } },
          { id: 's4', type: 'step', position: { x: 860, y: 300 }, data: { label: 'Send RCS', stepType: 'send_rcs', category: 'messaging', icon: '📱', channel: 'rcs', config: { message: 'Hello via RCS!' } } },
        ],
        edges: [
          { id: 'e-s1-s2', source: 's1', target: 's2' },
          { id: 'e-s2-s3', source: 's2', target: 's3' },
          { id: 'e-s2-s4', source: 's2', target: 's4' },
        ],
      },
      parameters: {},
    },
  },
];
