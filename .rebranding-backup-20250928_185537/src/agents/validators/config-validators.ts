export interface ConfigValidator {
  validate(context: any): Promise<any>;
}

export interface QualityDashboard {
  overallScore: number;
  issueBreakdown?: any;
}

export interface EnhancedValidationResults {
  score: number;
  issues: any[];
  warnings: string[];
  recommendations: any[];
  configurationScore: number;
}

export class RouteConfigValidator implements ConfigValidator {
  async validate(context: any): Promise<any> {
    return { issues: [], score: 100 };
  }
}

export class NavigationValidator implements ConfigValidator {
  async validate(context: any): Promise<any> {
    return { issues: [], score: 100 };
  }
}

export class ProfileContextValidator implements ConfigValidator {
  async validate(context: any): Promise<any> {
    return { issues: [], score: 100 };
  }
}

export class ProductionCodeValidator implements ConfigValidator {
  async validate(context: any): Promise<any> {
    return { issues: [], score: 100 };
  }
}

export class CrossFileValidator implements ConfigValidator {
  async validate(context: any): Promise<any> {
    return { issues: [], score: 100 };
  }
}