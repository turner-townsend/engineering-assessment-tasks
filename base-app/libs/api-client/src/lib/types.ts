import type { components } from './schema';

type Schemas = components['schemas'];

export type Project = Schemas['Project'];
export type ProjectDetail = Schemas['ProjectDetail'];
export type ProjectStatus = Schemas['ProjectStatus'];
export type CostSnapshot = Schemas['CostSnapshot'];
export type Milestone = Schemas['Milestone'];
export type RagStatus = Schemas['RagStatus'];
export type ChangeOrder = Schemas['ChangeOrder'];
export type ChangeOrderStatus = Schemas['ChangeOrderStatus'];
export type BenchmarkComparison = Schemas['BenchmarkComparison'];
export type BenchmarkPosition = Schemas['BenchmarkPosition'];
