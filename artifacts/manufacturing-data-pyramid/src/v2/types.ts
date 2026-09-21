export interface V2Level {
  id: string;
  index: number;
  name: string;
}

export interface V2Sector {
  id: string;
  index: number;
  name: string;
}

export interface V2GridConfig {
  width: number;
  height: number;
}

export interface V2Object {
  id: string;
  overlay: 'data' | 'models' | 'agents' | 'decisions';
  level_id: string;
  sector_id: string;
  grid_x: number;
  grid_y: number;
  name: string;
  description: string;
  availability: string;
  source: string;
  protocol: string;
  format: string;
  data_type: string;
  frequency: string;
  sensing_settings: string;
  preprocessing: string;
  intended_use: string;
}

export interface V2Connection {
  id: string;
  source_object_id: string;
  target_object_id: string;
  name: string;
}

export interface V2Overlays {
  data: V2Object[];
  models: V2Object[];
  agents: V2Object[];
  decisions: V2Object[];
  connectivity: V2Connection[];
}

export interface V2Case {
  id: string;
  name: string;
  levels: V2Level[];
  sectors: V2Sector[];
  grid: V2GridConfig;
  overlays: V2Overlays;
}
