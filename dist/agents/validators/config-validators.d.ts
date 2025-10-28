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
export declare class RouteConfigValidator implements ConfigValidator {
    validate(context: any): Promise<any>;
}
export declare class NavigationValidator implements ConfigValidator {
    validate(context: any): Promise<any>;
}
export declare class ProfileContextValidator implements ConfigValidator {
    validate(context: any): Promise<any>;
}
export declare class ProductionCodeValidator implements ConfigValidator {
    validate(context: any): Promise<any>;
}
export declare class CrossFileValidator implements ConfigValidator {
    validate(context: any): Promise<any>;
}
