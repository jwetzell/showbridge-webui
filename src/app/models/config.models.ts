export type Config = {
  modules: ModuleConfiguration[];
  routes: RouteConfiguration[];
};

export type ConfigState = {
  config: Config;
  timestamp: number;
  isCurrent: boolean;
};

export type ModuleConfiguration = {
  id?: string;
  type: string;
  params?: Record<string, any>;
};

export type RouteConfiguration = {
  input?: string;
  processors?: ProcessorConfiguration[];
  output?: string;
};

export type ProcessorConfiguration = {
  type: string;
  params?: Record<string, any>;
};
