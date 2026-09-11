export type DataCategory = 
  | 'signal' | 'time-series' | 'event' | 'model' | 'document' | 'record' | 'insight' | 'agent';

export interface DataObject {
  id: string;
  name: string;
  type: string;
  source: string;
  level: number;
  description?: string;
  category: DataCategory;
  position?: [number, number, number];
  isUserAdded?: boolean;
  isActive?: boolean;
}

export const LEVEL_CONTEXTS: Record<number, { name: string; purpose: string; examples: string }> = {
  1: { name: 'Shop-Floor Signals', purpose: 'Raw high-frequency data generation and device states.', examples: 'Sensors, PLCs, Actuators, Vision Cameras' },
  2: { name: 'Operational Context', purpose: 'State mapping, batch context, and aggregation.', examples: 'MES, SCADA, Historians, LIMS' },
  3: { name: 'Engineering Knowledge', purpose: 'Design intent, physical geometry, and simulation.', examples: 'PLM, CAD, CAM, Simulation (FEA/CFD)' },
  4: { name: 'Enterprise Information', purpose: 'Business logic, financial tracking, and supply chain.', examples: 'ERP, SCM, CMMS, CRM' },
  5: { name: 'Decision Intelligence', purpose: 'Autonomous agents, prescriptive actions, and orchestration.', examples: 'Control Towers, Agentic Orchestrators, AI Planners' }
};

export const PYRAMID_LEVELS = [
  { id: 1, name: 'Raw Signals', subtitle: 'Sense the physical process', color: '#17212d', edgeColor: '#64748b', height: 1.05, base: 5.4, top: 4.35, y: 0.5 },
  { id: 2, name: 'Operations', subtitle: 'Contextualise the run', color: '#122336', edgeColor: '#2dd4bf', height: 1.05, base: 4.35, top: 3.35, y: 1.65 },
  { id: 3, name: 'Engineering', subtitle: 'Compare with intent', color: '#172b4d', edgeColor: '#60a5fa', height: 1.05, base: 3.35, top: 2.35, y: 2.8 },
  { id: 4, name: 'Enterprise', subtitle: 'Plan the system', color: '#24345f', edgeColor: '#a78bfa', height: 1.05, base: 2.35, top: 1.35, y: 3.95 },
  { id: 5, name: 'Decisions', subtitle: 'Act with intelligence', color: '#0b5364', edgeColor: '#67e8f9', height: 1.05, base: 1.35, top: 0.15, y: 5.1 },
] as const;

export const DEFAULT_LEVEL_NAMES: Record<number, string> = Object.fromEntries(
  PYRAMID_LEVELS.map((level) => [level.id, level.name]),
);

export const EXPLODED_LEVEL_SPACING = 1.15;
export const DATA_OBJECT_PLATFORM_LIFT = 0.72;

export function getLevelY(level: number, exploded = false) {
  const definition = PYRAMID_LEVELS.find((item) => item.id === level);
  return (definition?.y ?? 0.5) + (exploded ? (level - 1) * EXPLODED_LEVEL_SPACING : 0);
}

export function getDataObjectY(level: number, exploded = false) {
  return getLevelY(level, exploded) + DATA_OBJECT_PLATFORM_LIFT;
}

export function isActiveDataObject(object: DataObject) {
  return object.isActive === true || object.isUserAdded === true;
}

export type CourseMode = 'data-science' | 'fundamentals-ai' | 'agentic-ai';

export const LIBRARY_ITEMS: Omit<DataObject, 'id'>[] = [
  { name: 'Vibration Signal', type: '100Hz Raw Data', source: 'CNC Spindle', level: 1, category: 'signal', description: 'Raw high-frequency vibration data indicating bearing health.' },
  { name: 'Thermocouple Data', type: 'Time-series', source: 'Injection Mold', level: 1, category: 'signal', description: 'Temperature readings from cavity sensors.' },
  
  { name: 'Historian Archive', type: 'Time-series DB', source: 'OSI PI', level: 2, category: 'time-series', description: 'Aggregated temperature and pressure data.' },
  { name: 'MES Event Log', type: 'State Change', source: 'SCADA', level: 2, category: 'event', description: 'Machine state transitions (Running, Idle, Down).' },
  { name: 'MES Run Context', type: 'Batch Record', source: 'MES', level: 2, category: 'record', description: 'Contextualized production run parameters.' },
  { name: 'Quality Result', type: 'Inspection', source: 'LIMS', level: 2, category: 'record', description: 'Pass/fail and dimensional variance.' },
  
  { name: 'Microstructure Image', type: 'Visual Data', source: 'Electron Microscope', level: 3, category: 'model', description: 'Material grain analysis for QA.' },
  { name: 'STL Model', type: '3D Geometry', source: 'CAD', level: 3, category: 'document', description: 'Designed part geometry for comparison.' },
  { name: 'CAD Drawing', type: '2D/3D Design', source: 'PLM', level: 3, category: 'document', description: 'Engineering design specifications.' },
  { name: 'Point Cloud', type: 'Spatial Data', source: 'Laser Scanner', level: 3, category: 'model', description: '3D scan of physical part.' },
  { name: 'Simulation Result', type: 'FEA/CFD', source: 'CAE', level: 3, category: 'insight', description: 'Simulated stress and thermal analysis.' },
  
  { name: 'Statistical Analysis', type: 'SPC Model', source: 'Data Lake', level: 4, category: 'insight', description: 'Process capability and drift analysis.' },
  { name: 'ERP Order', type: 'Production Order', source: 'SAP', level: 4, category: 'record', description: 'Customer order details and required quantities.' },
  { name: 'Maintenance Record', type: 'Work Order', source: 'CMMS', level: 4, category: 'document', description: 'Historical repair logs and parts replaced.' },
  { name: 'Cost Record', type: 'Financial Data', source: 'ERP', level: 4, category: 'record', description: 'Material and labor cost allocation.' },
  
  { name: 'Management Decision', type: 'Action', source: 'Executive Dashboard', level: 5, category: 'agent', description: 'Strategic rerouting or maintenance scheduling.' },
  { name: 'Agentic Dispatcher', type: 'AI Agent', source: 'Control Tower', level: 5, category: 'agent', description: 'Automatically reroutes production if a machine fails.' }
];

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  description: string;
}

export interface CourseConfig {
  initialObjects: DataObject[];
  relationships: Relationship[];
  journeySteps: { title: string; desc: string; level: number; objectIds?: string[]; relationshipIds?: string[] }[];
}

export function getJourneyStep(course: CourseConfig, step: number) {
  return course.journeySteps[Math.min(Math.max(step, 0), Math.max(course.journeySteps.length - 1, 0))] ?? {
    title: '',
    desc: '',
    level: 1,
    objectIds: [],
    relationshipIds: [],
  };
}

export const COURSES: Record<CourseMode, CourseConfig> = {
  'data-science': {
    initialObjects: [
      { id: 'ds-1', name: 'CNC Cell', type: 'Machine', source: 'Shop Floor', level: 1, category: 'event', position: [-1.6, 0, 0.9], description: 'The physical process where production signals originate.' },
      { id: 'ds-2', name: 'Temperature Sensor', type: 'Signal', source: 'Injection Mold', level: 1, category: 'signal', position: [-0.6, 0, 1.25], description: 'Continuous thermal readings from the process.' },
      { id: 'ds-3', name: 'Vibration Node', type: 'Signal', source: 'CNC Spindle', level: 1, category: 'signal', position: [0.7, 0, 0.95], description: 'High-frequency vibration indicating machine health.' },
      { id: 'ds-4', name: 'Vision Camera', type: 'Image', source: 'Inspection Cell', level: 1, category: 'model', position: [1.55, 0, 0.25], description: 'Visual inspection captures quality evidence.' },
      { id: 'ds-5', name: 'Historian', type: 'Storage', source: 'SCADA', level: 2, category: 'time-series', position: [-1.25, 0, 0.65], description: 'Time-series storage preserves the process history.' },
      { id: 'ds-6', name: 'PLC / SCADA', type: 'State', source: 'Control Layer', level: 2, category: 'event', position: [-0.25, 0, 0.9], description: 'Control states turn raw signals into operating context.' },
      { id: 'ds-7', name: 'MES Run', type: 'Context', source: 'MES', level: 2, category: 'record', position: [0.65, 0, 0.25], description: 'A production run joins signal history to a batch.' },
      { id: 'ds-8', name: 'Quality Result', type: 'Inspection', source: 'LIMS', level: 2, category: 'record', position: [0.95, 0, -0.75], description: 'Inspection results expose process variation.' },
      { id: 'ds-16', name: 'Maintenance Record', type: 'Work Order', source: 'CMMS', level: 2, category: 'document', position: [-0.9, 0, -0.65], description: 'Maintenance history explains the condition behind a signal.' },
      { id: 'ds-9', name: 'CAD Assembly', type: '3D Geometry', source: 'PLM', level: 3, category: 'document', position: [-0.85, 0, 0.55], description: 'Engineering intent provides the reference geometry.' },
      { id: 'ds-10', name: 'FEA Simulation', type: 'Stress Model', source: 'CAE', level: 3, category: 'model', position: [0.75, 0, -0.2], description: 'Simulation predicts how the part behaves.' },
      { id: 'ds-11', name: 'ERP Order', type: 'Production Order', source: 'ERP', level: 4, category: 'record', position: [-0.55, 0, 0.25], description: 'Business demand frames the production decision.' },
      { id: 'ds-12', name: 'Inventory Signal', type: 'Supply State', source: 'SCM', level: 4, category: 'time-series', position: [0.55, 0, -0.25], description: 'Material availability constrains the plan.' },
      { id: 'ds-13', name: 'Statistical Analysis', type: 'SPC', source: 'Analytics', level: 4, category: 'insight', position: [0, 0, 0.75], description: 'Models process history to expose drift and risk.' },
      { id: 'ds-14', name: 'AI Control Tower', type: 'Decision Model', source: 'Operations AI', level: 5, category: 'agent', position: [-0.75, 0, 0.15], description: 'Analytics and context become an operational recommendation.' },
      { id: 'ds-15', name: 'Management Decision', type: 'Action', source: 'Executive Dashboard', level: 5, category: 'agent', position: [0.75, 0, -0.15], description: 'A decision routes production, maintenance, or quality action.' }
    ],
    relationships: [
      { id: 'rel-1', sourceId: 'ds-2', targetId: 'ds-5', description: 'Raw temperature signals stream to the historian.' },
      { id: 'rel-2', sourceId: 'ds-3', targetId: 'ds-6', description: 'Vibration and machine state are contextualised by controls.' },
      { id: 'rel-3', sourceId: 'ds-5', targetId: 'ds-7', description: 'History is joined to the active MES production run.' },
      { id: 'rel-4', sourceId: 'ds-7', targetId: 'ds-8', description: 'Run context is correlated with quality inspection.' },
      { id: 'rel-5', sourceId: 'ds-8', targetId: 'ds-10', description: 'Observed variance is compared with engineering simulation.' },
      { id: 'rel-6', sourceId: 'ds-10', targetId: 'ds-13', description: 'Engineering knowledge improves statistical analysis.' },
      { id: 'rel-7', sourceId: 'ds-11', targetId: 'ds-13', description: 'Demand and production context frame the analysis.' },
      { id: 'rel-8', sourceId: 'ds-13', targetId: 'ds-14', description: 'Analysis produces a ranked operational recommendation.' },
      { id: 'rel-9', sourceId: 'ds-14', targetId: 'ds-15', description: 'Decision intelligence turns evidence into action.' }
    ],
    journeySteps: [
      { title: "Sources", desc: "Continuous raw signals generated from shop floor sensors.", level: 1, objectIds: ['ds-1', 'ds-2', 'ds-3', 'ds-4'] },
      { title: "Storage", desc: "High-frequency data is compressed and archived in the Historian.", level: 2, objectIds: ['ds-5', 'ds-6'], relationshipIds: ['rel-1', 'rel-2'] },
      { title: "Contextualization", desc: "MES maps time-series data to specific production runs.", level: 2, objectIds: ['ds-7', 'ds-16'], relationshipIds: ['rel-3'] },
      { title: "Quality", desc: "LIMS results are joined with run context to identify deviations.", level: 2, objectIds: ['ds-8'], relationshipIds: ['rel-4'] },
      { title: "Analysis", desc: "SPC models process historical variances to detect drift.", level: 4, objectIds: ['ds-10', 'ds-13'], relationshipIds: ['rel-5', 'rel-6', 'rel-7', 'rel-8'] },
      { title: "Decision", desc: "Executives and rule engines make informed routing decisions.", level: 5, objectIds: ['ds-14', 'ds-15'], relationshipIds: ['rel-9'] },
    ]
  },
  'fundamentals-ai': {
    initialObjects: [
      { id: 'fai-1', name: 'Camera Image', type: 'Image', source: 'Inspection Stn', level: 1, category: 'signal', position: [-0.8, 0, 0.8] },
      { id: 'fai-2', name: 'Computer Vision', type: 'Model', source: 'Edge GPU', level: 3, category: 'model', position: [-0.8, 0, 0.4] },
      
      { id: 'fai-3', name: 'Sensor Time Series', type: 'Time-series', source: 'Historian', level: 2, category: 'time-series', position: [0, 0, 1] },
      { id: 'fai-4', name: 'Forecasting / Anomaly', type: 'Model', source: 'Cloud', level: 4, category: 'insight', position: [0, 0, 0.5] },
      
      { id: 'fai-5', name: 'Tabular Data', type: 'Record', source: 'ERP', level: 4, category: 'record', position: [0.8, 0, 0.8] },
      { id: 'fai-6', name: 'Regression / Classify', type: 'Model', source: 'Data Lake', level: 5, category: 'insight', position: [0.8, 0, 0.4] },

      { id: 'fai-7', name: 'Maintenance Log (Text)', type: 'Document', source: 'CMMS', level: 4, category: 'document', position: [1.2, 0, -0.2] },
      { id: 'fai-8', name: 'NLP / LLM', type: 'Embeddings', source: 'AI Service', level: 5, category: 'agent', position: [1.2, 0, -0.6] }
    ],
    relationships: [
      { id: 'r-fai-1', sourceId: 'fai-1', targetId: 'fai-2', description: 'Images are processed by Computer Vision models.' },
      { id: 'r-fai-2', sourceId: 'fai-3', targetId: 'fai-4', description: 'Time series feeds anomaly detection & forecasting.' },
      { id: 'r-fai-3', sourceId: 'fai-5', targetId: 'fai-6', description: 'Tabular records train regression/classification models.' },
      { id: 'r-fai-4', sourceId: 'fai-7', targetId: 'fai-8', description: 'Text logs are converted to embeddings by NLP/LLM.' }
    ],
    journeySteps: [
      { title: "Image to Vision", desc: "Visual data mapped to Computer Vision models.", level: 1, objectIds: ['fai-1', 'fai-2'], relationshipIds: ['r-fai-1'] },
      { title: "Time Series to Forecasting", desc: "Sequential data feeds anomaly and forecasting models.", level: 2, objectIds: ['fai-3', 'fai-4'], relationshipIds: ['r-fai-2'] },
      { title: "Tabular to Classification", desc: "Structured records train regression and classification.", level: 4, objectIds: ['fai-5', 'fai-6'], relationshipIds: ['r-fai-3'] },
      { title: "Text to NLP", desc: "Unstructured text is parsed by LLMs and embeddings.", level: 5, objectIds: ['fai-7', 'fai-8'], relationshipIds: ['r-fai-4'] }
    ]
  },
  'agentic-ai': {
    initialObjects: [
      { id: 'aai-0', name: 'Sensor Telemetry', type: 'Signal', source: 'Shop Floor IoT', level: 1, category: 'signal', position: [-0.8, 0, 0.65] },
      { id: 'aai-1', name: 'Live Data Stream', type: 'Data', source: 'IoT Gateway', level: 2, category: 'time-series', position: [-0.5, 0, 0.5] },
      { id: 'aai-2', name: 'Predictive Model', type: 'Tool', source: 'MLOps', level: 4, category: 'model', position: [0.5, 0, 0.5] },
      { id: 'aai-3', name: 'Engineering Knowledge', type: 'Knowledge', source: 'PLM', level: 3, category: 'document', position: [-0.5, 0, -0.5] },
      { id: 'aai-4', name: 'Agentic Orchestrator', type: 'Agent', source: 'Control Tower', level: 5, category: 'agent', position: [0, 0, 0] },
      { id: 'aai-5', name: 'Control Action', type: 'Action', source: 'MES', level: 2, category: 'event', position: [0.5, 0, -0.5] }
    ],
    relationships: [
      { id: 'r-aai-0', sourceId: 'aai-0', targetId: 'aai-1', description: 'Shop-floor telemetry enters the agent data stream.' },
      { id: 'r-aai-1', sourceId: 'aai-1', targetId: 'aai-4', description: 'Agent monitors live data streams.' },
      { id: 'r-aai-2', sourceId: 'aai-3', targetId: 'aai-4', description: 'Agent retrieves required knowledge context.' },
      { id: 'r-aai-3', sourceId: 'aai-4', targetId: 'aai-2', description: 'Agent invokes predictive models as tools.' },
      { id: 'r-aai-4', sourceId: 'aai-4', targetId: 'aai-5', description: 'Agent executes autonomous control actions.' }
    ],
    journeySteps: [
      { title: "Sensing Data", desc: "Agents monitor live operational data streams.", level: 2, objectIds: ['aai-0', 'aai-1', 'aai-5'], relationshipIds: ['r-aai-0', 'r-aai-1'] },
      { title: "Retrieving Knowledge", desc: "Agents pull necessary context from engineering systems.", level: 3, objectIds: ['aai-3', 'aai-4'], relationshipIds: ['r-aai-2'] },
      { title: "Invoking Tools", desc: "Agents use specialized predictive models to evaluate options.", level: 4, objectIds: ['aai-2', 'aai-4'], relationshipIds: ['r-aai-3'] },
      { title: "Taking Action", desc: "Agents execute autonomous interventions based on their reasoning.", level: 5, objectIds: ['aai-4', 'aai-5'], relationshipIds: ['r-aai-4'] }
    ]
  }
};
