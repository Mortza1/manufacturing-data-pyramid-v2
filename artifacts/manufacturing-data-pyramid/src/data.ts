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
  journeySteps: { title: string; desc: string; level: number }[];
}

export const COURSES: Record<CourseMode, CourseConfig> = {
  'data-science': {
    initialObjects: [
      { id: 'ds-1', name: 'Temperature Sensor', type: 'Signal', source: 'Shop Floor', level: 1, category: 'signal', position: [-1, 0, 1] },
      { id: 'ds-2', name: 'Historian', type: 'Storage', source: 'SCADA', level: 2, category: 'time-series', position: [-0.6, 0, 0.6] },
      { id: 'ds-3', name: 'MES Run', type: 'Context', source: 'MES', level: 2, category: 'event', position: [-0.3, 0, 0.3] },
      { id: 'ds-4', name: 'Quality Result', type: 'Inspection', source: 'LIMS', level: 2, category: 'record', position: [0.3, 0, -0.3] },
      { id: 'ds-5', name: 'Statistical Analysis', type: 'SPC', source: 'Analytics', level: 4, category: 'insight', position: [0, 0, 0] },
      { id: 'ds-6', name: 'Management Decision', type: 'Action', source: 'Dashboard', level: 5, category: 'agent', position: [0, 0, 0] }
    ],
    relationships: [
      { id: 'rel-1', sourceId: 'ds-1', targetId: 'ds-2', description: 'Raw temp signals stream to historian' },
      { id: 'rel-2', sourceId: 'ds-2', targetId: 'ds-3', description: 'Aggregated to MES run context' },
      { id: 'rel-3', sourceId: 'ds-3', targetId: 'ds-4', description: 'Run correlated to Quality Result' },
      { id: 'rel-4', sourceId: 'ds-4', targetId: 'ds-5', description: 'Variance feeds statistical analysis' },
      { id: 'rel-5', sourceId: 'ds-5', targetId: 'ds-6', description: 'Analysis dictates decision' }
    ],
    journeySteps: [
      { title: "Sources", desc: "Continuous raw signals generated from shop floor sensors.", level: 1 },
      { title: "Storage", desc: "High-frequency data is compressed and archived in the Historian.", level: 2 },
      { title: "Contextualization", desc: "MES maps time-series data to specific production runs.", level: 2 },
      { title: "Quality", desc: "LIMS results are joined with run context to identify deviations.", level: 2 },
      { title: "Analysis", desc: "SPC models process historical variances to detect drift.", level: 4 },
      { title: "Decision", desc: "Executives and rule engines make informed routing decisions.", level: 5 },
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
      { title: "Image to Vision", desc: "Visual data mapped to Computer Vision models.", level: 1 },
      { title: "Time Series to Forecasting", desc: "Sequential data feeds anomaly and forecasting models.", level: 2 },
      { title: "Tabular to Classification", desc: "Structured records train regression and classification.", level: 4 },
      { title: "Text to NLP", desc: "Unstructured text is parsed by LLMs and embeddings.", level: 5 }
    ]
  },
  'agentic-ai': {
    initialObjects: [
      { id: 'aai-1', name: 'Live Data Stream', type: 'Data', source: 'IoT Gateway', level: 2, category: 'time-series', position: [-0.5, 0, 0.5] },
      { id: 'aai-2', name: 'Predictive Model', type: 'Tool', source: 'MLOps', level: 4, category: 'model', position: [0.5, 0, 0.5] },
      { id: 'aai-3', name: 'Engineering Knowledge', type: 'Knowledge', source: 'PLM', level: 3, category: 'document', position: [-0.5, 0, -0.5] },
      { id: 'aai-4', name: 'Agentic Orchestrator', type: 'Agent', source: 'Control Tower', level: 5, category: 'agent', position: [0, 0, 0] },
      { id: 'aai-5', name: 'Control Action', type: 'Action', source: 'MES', level: 2, category: 'event', position: [0.5, 0, -0.5] }
    ],
    relationships: [
      { id: 'r-aai-1', sourceId: 'aai-1', targetId: 'aai-4', description: 'Agent monitors live data streams.' },
      { id: 'r-aai-2', sourceId: 'aai-3', targetId: 'aai-4', description: 'Agent retrieves required knowledge context.' },
      { id: 'r-aai-3', sourceId: 'aai-4', targetId: 'aai-2', description: 'Agent invokes predictive models as tools.' },
      { id: 'r-aai-4', sourceId: 'aai-4', targetId: 'aai-5', description: 'Agent executes autonomous control actions.' }
    ],
    journeySteps: [
      { title: "Sensing Data", desc: "Agents monitor live operational data streams.", level: 2 },
      { title: "Retrieving Knowledge", desc: "Agents pull necessary context from engineering systems.", level: 3 },
      { title: "Invoking Tools", desc: "Agents use specialized predictive models to evaluate options.", level: 4 },
      { title: "Taking Action", desc: "Agents execute autonomous interventions based on their reasoning.", level: 5 }
    ]
  }
};
