
export interface MenuItem {
  name: string;
  price: number;
  description?: string;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface AnalysisResults {
  overallScore: number;
  oneSentenceSummary: string;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  metrics: {
    totalItems: number;
    sizeCategory: 'Small' | 'Medium' | 'Large';
    complexityScore: number;
    pricing: {
      minPrice: number;
      maxPrice: number;
      medianPrice: number;
    };
  };
  breakdown: {
    simplicityScore: number;
    pricingScore: number;
    balanceScore: number;
    marginScore: number;
  };
  positives: string[];
  issues: string[];
  quickWins: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}
