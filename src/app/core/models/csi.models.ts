export type UserRole = 'csi' | 'nike';

export interface CsiMeta {
  colorsScored: number;
  transactions: number;
  demandRows: number;
  monthRange: string;
  trendsMatched: string;
  familyCount: number;
  brandCount: number;
}

export interface BrandAdoption {
  name: string;
  share: number;
  vol: number;
  trend: 'up' | 'down' | 'flat';
}

export interface EmergenceFactors {
  velocity: number;
  acceleration: number;
  adoption: number;
  recency: number;
}

export interface TrendFactors {
  size: number;
  sustained: number;
  breadth: number;
  consistency: number;
}

export interface ColorDirectionRef {
  lens: 'emerging' | 'trending';
  dir_id: number;
  leader: string;
  prob: number;
  avg: number;
}

export interface ColorStandard {
  id: string;
  n: string;
  hex: string;
  L: number;
  a: number;
  b: number;
  fam: string;
  e: number;
  t: number;
  q: 'Emerging' | 'Breakout' | 'Core' | 'Dormant';
  vol: number;
  brands?: number;
  brandCount?: number;
  mom?: string;
  nt?: string;
  nde?: number;
  ty?: string;
  sub?: string;
  spk?: number[];
  topBrands?: BrandAdoption[];
  fc?: number[];
  fcLo?: number[];
  fcHi?: number[];
  phase?: string;
  slope?: number;
  dir?: ColorDirectionRef;
  eF?: EmergenceFactors;
  tF?: TrendFactors;
}

export interface DirectionMember {
  id: string;
  n: string;
  hex: string;
  L: number;
  a: number;
  b: number;
  e: number;
  t: number;
}

export interface TrendDirection {
  dir_id: number;
  leader: string;
  leaderHex?: string;
  family: string;
  size: number;
  vol: number;
  recentVol?: number;
  priorVol?: number;
  avg: number;
  breakoutProb?: number;
  prob?: number;
  lens?: 'emerging' | 'trending';
  members: DirectionMember[];
  history?: number[];
  forecast?: number[];
  fcLo?: number[];
  fcHi?: number[];
}

export interface ExternalTrend {
  source: string;
  trend: string;
  name?: string;
  hex: string;
  anchor?: {
    id: string;
    name: string;
    hex: string;
    de: number;
  };
}

export interface ColorFamilyInfo {
  family: string;
  hex: string;
  colors: number;
}

export interface BrandSlice {
  colors: number;
  totalVolume: number;
  factories?: number;
  familyMix: Record<string, number>;
  emergingColors?: Array<{
    InvID?: string;
    id?: string;
    name: string;
    hex: string;
    family: string;
    momentum?: string;
  }>;
  topColors?: Array<{
    name: string;
    hex: string;
    vol: number;
  }>;
}

export interface InventoryReorderItem {
  id: string;
  n: string;
  hex: string;
  fam: string;
  weeklyDemand: number;
  fwdWeekly: number;
  slope: number;
  coverWeeks: number;
  reorderQty: number;
  status: string;
}

export interface InventoryDeadStockItem {
  id: string;
  n: string;
  hex: string;
  fam: string;
  stock: number;
  weeklyDemand: number;
  coverWeeks: number;
  brands?: number;
  status: string;
}

export interface InventoryFamilyItem {
  family: string;
  skus: number;
  stock: number;
  weeklyDemand: number;
  coverWeeks: number;
  reorder: number;
  dead: number;
}

export interface InventoryPlanItem {
  lens: 'emerging' | 'trending';
  leader: string;
  family: string;
  current: number;
  predicted: number;
  growth: number;
  breakoutProb?: number;
  action: 'Develop' | 'Expand' | 'Maintain' | 'Retire';
  suggestStandards?: number;
  members: DirectionMember[];
}

export interface CsiDatabase {
  meta: CsiMeta;
  quadrantCounts: Record<'Dormant' | 'Breakout' | 'Core' | 'Emerging', number>;
  colors: ColorStandard[];
  emergingDirections: TrendDirection[];
  trendingDirections: TrendDirection[];
  breakoutShortlist: TrendDirection[];
  momentumTimeline: {
    quarters: string[];
    series: Record<'Breakout' | 'Core' | 'Emerging' | 'Dormant', number[]>;
  };
  families: ColorFamilyInfo[];
  trends: ExternalTrend[];
  demoBrands: string[];
  demoNames: Record<string, string>;
  brandSlices: Record<string, BrandSlice>;
  inventoryOps: {
    summary: {
      reorderNow: number;
      reorderUnits: number;
      deadStock: number;
      deadUnits: number;
      healthy: number;
      skus: number;
    };
    reorder: InventoryReorderItem[];
    deadStock: InventoryDeadStockItem[];
    byFamily: InventoryFamilyItem[];
  };
  inventoryPlan: InventoryPlanItem[];
  nike: {
    colorCount: number;
    emergingCount: number;
    totalVolume: number;
    familyMix: Record<string, number>;
    colors: ColorStandard[];
    recommendations: TrendDirection[];
    gap?: {
      covered?: string[];
    };
    benchmark?: Record<string, unknown>;
  };
}

