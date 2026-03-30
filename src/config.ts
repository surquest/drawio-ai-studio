export const config = {
  google: {
    clientId: (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '') as string,
    projectId: (process.env.NEXT_PUBLIC_GOOGLE_PROJECT_ID || '') as string,
    region: (process.env.NEXT_PUBLIC_GOOGLE_REGION || 'us-central1') as string,
    scopes: ['openid', 'email', 'https://www.googleapis.com/auth/cloud-platform'],
    iap: {
      enabled: process.env.NEXT_PUBLIC_IAP_ENABLED === 'true',
    }
  },
  drawio: {
    baseUrl: process.env.NEXT_PUBLIC_DRAWIO_BASE_URL || '',
    params: {
      embed: 1,
      spin: 1,
      proto: 'json',
      saveAndExit: 0,
      noSaveBtn: 1,
      noExitBtn: 1,
      configure: 1,
    },
    libs: ['general'],
    clibs: [
      'Uhttps://raw.githubusercontent.com/jgraph/drawio-libs/refs/heads/review/libs/material-design-icons.xml'
    ],
    defaultStyles: {
      appendCustomLibraries: true,
      defaultFonts: ["Verdana", "Helvetica", "Times New Roman"],
      customFonts: [
        {
          fontFamily: "Bai Jamjuree",
          fontUrl: "https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@200;300;400;500;600;700&display=swap"
        }
      ],
      // All configurations documented here: https://www.drawio.com/doc/faq/configure-diagram-editor
    },
  },
  ui: {
    title: 'Draw.io Studio',
    sidebarLeftTitle: 'Prompt Settings',
    sidebarRightTitle: 'XML Code Editor',
    sidebarWidth: 'min(650px, 100vw)',
  },
  gemini: {
    endpointPattern: process.env.NEXT_PUBLIC_GEMINI_ENDPOINT_PATTERN || 'https://aiplatform.googleapis.com/v1/projects/[PROJECT_ID]/locations/[REGION]/publishers/google/models/[MODEL]:generateContent',
    defaultModel: process.env.NEXT_PUBLIC_GEMINI_DEFAULT_MODEL || 'gemini-3.1-flash-lite-preview',
    models: [
      { 
        id: 'gemini-3.1-pro-preview', 
        label: 'Gemini 3.1 Pro Preview', 
        pricing: {
          standard: { input: 2, output: 12.00 },
          priority: { input: 3.6, output: 21.60 }
        } 
      },
      { 
        id: 'gemini-3.1-flash-lite-preview', 
        label: 'Gemini 3.1 Flash Lite Preview', 
        pricing: {
          standard: { input: 0.25, output: 1.50 },
          priority: { input: 0.45, output: 2.7 }
        } 
      },
      { 
        id: 'gemini-3-pro-preview', 
        label: 'Gemini 3.0 Pro Preview', 
        pricing: {
          standard: { input: 2, output: 12.00 },
          priority: { input: 3.6, output: 21.60 }
        } 
      },
      { 
        id: 'gemini-3-flash-preview', 
        label: 'Gemini 3.0 Flash Preview', 
        pricing: {
          standard: { input: 0.5, output: 3 },
          priority: { input: 0.9, output: 5.40 }
        } 
      },
      { 
        id: 'gemini-2.5-flash', 
        label: 'Gemini 2.5 Flash', 
        pricing: {
          standard: { input: 0.3, output: 2.50 },
          priority: { input: 0.54, output: 4.50 }
        } 
      },
      { 
        id: 'gemini-2.5-pro', 
        label: 'Gemini 2.5 Pro', 
        pricing: {
          standard: { input: 1.25, output: 10.00 },
          priority: { input: 2.25, output: 18.00 }
        } 
      },
    ],
    thinkingLevels: [
      { id: 'low', label: 'Low' },
      { id: 'medium', label: 'Medium' },
      { id: 'high', label: 'High' }
    ],
    requestTiers: [
      { id: 'standard', label: 'Standard' },
      // { id: 'flex', label: 'Flex' },
      // { id: 'priority', label: 'Priority' }
    ],
    defaultInstructionsPath: '/examples/instructions/default-instructions.md',
    defaultPromptPath: '/examples/prompts/default-example.md',
    examplePrompts: [
      { id: 'default', label: 'BIGDOTS Architecture', path: '/examples/prompts/default-example.md' },
      { id: 'dataflow-sql', label: 'Dataflow SQL', path: '/examples/prompts/dataflow-sql.md' },
      { id: 'solution-architect', label: 'Solution Architect', path: '/examples/prompts/solution-architect.md' },
    ],
    exampleInstructions: [
      { id: 'solution-architect', label: 'Solution Architect', path: '/examples/instructions/solution-architect.md' },
      { id: 'sre-topology', label: 'SRE Topology', path: '/examples/instructions/sre-topology.md' },
    ]
  },
  pptxConverter: {
    slideWidth: 13.3,
    slideHeight: 7.5,
    slideMargin: 0.1,
    maxEdgeRound: 0.1,
    previewDpi: 96,
    defaults: {
        fontFamily: 'Arial',
        fontSize: 12,
        fontColor: '000000',
        strokeColor: '000000',
        strokeWidth: 1,
        defaultLineColor: '000000',
    },
    fontSizeScaler: 0.75
  }
};
