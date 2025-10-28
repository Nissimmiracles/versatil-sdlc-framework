import { EventEmitter } from 'events';
import { z } from 'zod';
export declare const AccessibilityIssueSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["color_contrast", "keyboard_navigation", "screen_reader", "focus_management", "semantic_markup", "aria_labels", "form_accessibility", "image_alt_text", "heading_structure", "link_purpose", "error_identification", "timeout_handling", "motion_preferences"]>;
    severity: z.ZodEnum<["critical", "serious", "moderate", "minor"]>;
    wcag_level: z.ZodEnum<["A", "AA", "AAA"]>;
    wcag_criterion: z.ZodString;
    element: z.ZodObject<{
        tag: z.ZodString;
        selector: z.ZodString;
        xpath: z.ZodString;
        attributes: z.ZodRecord<z.ZodString, z.ZodString>;
        text_content: z.ZodOptional<z.ZodString>;
        computed_styles: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        tag?: string;
        selector?: string;
        xpath?: string;
        attributes?: Record<string, string>;
        text_content?: string;
        computed_styles?: Record<string, string>;
    }, {
        tag?: string;
        selector?: string;
        xpath?: string;
        attributes?: Record<string, string>;
        text_content?: string;
        computed_styles?: Record<string, string>;
    }>;
    description: z.ZodString;
    impact: z.ZodString;
    fix_suggestions: z.ZodArray<z.ZodString, "many">;
    automated_fix_available: z.ZodBoolean;
    code_fix: z.ZodOptional<z.ZodString>;
    test_method: z.ZodString;
    file_path: z.ZodString;
    line_number: z.ZodOptional<z.ZodNumber>;
    column_number: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: "color_contrast" | "keyboard_navigation" | "screen_reader" | "focus_management" | "semantic_markup" | "aria_labels" | "form_accessibility" | "image_alt_text" | "heading_structure" | "link_purpose" | "error_identification" | "timeout_handling" | "motion_preferences";
    id?: string;
    description?: string;
    severity?: "critical" | "minor" | "moderate" | "serious";
    impact?: string;
    wcag_level?: "A" | "AA" | "AAA";
    wcag_criterion?: string;
    element?: {
        tag?: string;
        selector?: string;
        xpath?: string;
        attributes?: Record<string, string>;
        text_content?: string;
        computed_styles?: Record<string, string>;
    };
    fix_suggestions?: string[];
    automated_fix_available?: boolean;
    code_fix?: string;
    test_method?: string;
    file_path?: string;
    line_number?: number;
    column_number?: number;
}, {
    type?: "color_contrast" | "keyboard_navigation" | "screen_reader" | "focus_management" | "semantic_markup" | "aria_labels" | "form_accessibility" | "image_alt_text" | "heading_structure" | "link_purpose" | "error_identification" | "timeout_handling" | "motion_preferences";
    id?: string;
    description?: string;
    severity?: "critical" | "minor" | "moderate" | "serious";
    impact?: string;
    wcag_level?: "A" | "AA" | "AAA";
    wcag_criterion?: string;
    element?: {
        tag?: string;
        selector?: string;
        xpath?: string;
        attributes?: Record<string, string>;
        text_content?: string;
        computed_styles?: Record<string, string>;
    };
    fix_suggestions?: string[];
    automated_fix_available?: boolean;
    code_fix?: string;
    test_method?: string;
    file_path?: string;
    line_number?: number;
    column_number?: number;
}>;
export declare const AccessibilityTestConfigSchema: z.ZodObject<{
    test_types: z.ZodArray<z.ZodEnum<["automated_scan", "keyboard_navigation", "screen_reader_simulation", "color_contrast_analysis", "focus_management_test", "semantic_structure_validation", "form_accessibility_test", "media_accessibility_test", "motion_accessibility_test"]>, "many">;
    wcag_level: z.ZodEnum<["A", "AA", "AAA"]>;
    browser_targets: z.ZodArray<z.ZodString, "many">;
    assistive_technologies: z.ZodArray<z.ZodString, "many">;
    viewport_sizes: z.ZodArray<z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        width?: number;
        height?: number;
    }, {
        name?: string;
        width?: number;
        height?: number;
    }>, "many">;
    color_vision_simulations: z.ZodArray<z.ZodEnum<["protanopia", "deuteranopia", "tritanopia", "achromatopsia", "protanomaly", "deuteranomaly", "tritanomaly"]>, "many">;
    motion_preferences: z.ZodArray<z.ZodEnum<["reduce", "no-preference"]>, "many">;
    test_environments: z.ZodArray<z.ZodEnum<["development", "staging", "production"]>, "many">;
    reporting_format: z.ZodEnum<["json", "html", "pdf", "csv"]>;
}, "strip", z.ZodTypeAny, {
    motion_preferences?: ("reduce" | "no-preference")[];
    wcag_level?: "A" | "AA" | "AAA";
    test_types?: ("keyboard_navigation" | "automated_scan" | "screen_reader_simulation" | "color_contrast_analysis" | "focus_management_test" | "semantic_structure_validation" | "form_accessibility_test" | "media_accessibility_test" | "motion_accessibility_test")[];
    browser_targets?: string[];
    assistive_technologies?: string[];
    viewport_sizes?: {
        name?: string;
        width?: number;
        height?: number;
    }[];
    color_vision_simulations?: ("protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia" | "protanomaly" | "deuteranomaly" | "tritanomaly")[];
    test_environments?: ("development" | "staging" | "production")[];
    reporting_format?: "json" | "csv" | "html" | "pdf";
}, {
    motion_preferences?: ("reduce" | "no-preference")[];
    wcag_level?: "A" | "AA" | "AAA";
    test_types?: ("keyboard_navigation" | "automated_scan" | "screen_reader_simulation" | "color_contrast_analysis" | "focus_management_test" | "semantic_structure_validation" | "form_accessibility_test" | "media_accessibility_test" | "motion_accessibility_test")[];
    browser_targets?: string[];
    assistive_technologies?: string[];
    viewport_sizes?: {
        name?: string;
        width?: number;
        height?: number;
    }[];
    color_vision_simulations?: ("protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia" | "protanomaly" | "deuteranomaly" | "tritanomaly")[];
    test_environments?: ("development" | "staging" | "production")[];
    reporting_format?: "json" | "csv" | "html" | "pdf";
}>;
export declare const AccessibilityFixSchema: z.ZodObject<{
    issue_id: z.ZodString;
    fix_type: z.ZodEnum<["automated", "semi_automated", "manual"]>;
    implementation: z.ZodObject<{
        code_changes: z.ZodArray<z.ZodObject<{
            file_path: z.ZodString;
            original_code: z.ZodString;
            fixed_code: z.ZodString;
            explanation: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            explanation?: string;
            file_path?: string;
            original_code?: string;
            fixed_code?: string;
        }, {
            explanation?: string;
            file_path?: string;
            original_code?: string;
            fixed_code?: string;
        }>, "many">;
        css_changes: z.ZodArray<z.ZodObject<{
            selector: z.ZodString;
            properties: z.ZodRecord<z.ZodString, z.ZodString>;
            explanation: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            explanation?: string;
            selector?: string;
            properties?: Record<string, string>;
        }, {
            explanation?: string;
            selector?: string;
            properties?: Record<string, string>;
        }>, "many">;
        attribute_changes: z.ZodArray<z.ZodObject<{
            element_selector: z.ZodString;
            attributes: z.ZodRecord<z.ZodString, z.ZodString>;
            explanation: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            explanation?: string;
            attributes?: Record<string, string>;
            element_selector?: string;
        }, {
            explanation?: string;
            attributes?: Record<string, string>;
            element_selector?: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        code_changes?: {
            explanation?: string;
            file_path?: string;
            original_code?: string;
            fixed_code?: string;
        }[];
        css_changes?: {
            explanation?: string;
            selector?: string;
            properties?: Record<string, string>;
        }[];
        attribute_changes?: {
            explanation?: string;
            attributes?: Record<string, string>;
            element_selector?: string;
        }[];
    }, {
        code_changes?: {
            explanation?: string;
            file_path?: string;
            original_code?: string;
            fixed_code?: string;
        }[];
        css_changes?: {
            explanation?: string;
            selector?: string;
            properties?: Record<string, string>;
        }[];
        attribute_changes?: {
            explanation?: string;
            attributes?: Record<string, string>;
            element_selector?: string;
        }[];
    }>;
    validation: z.ZodObject<{
        test_method: z.ZodString;
        expected_outcome: z.ZodString;
        verification_steps: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        test_method?: string;
        expected_outcome?: string;
        verification_steps?: string[];
    }, {
        test_method?: string;
        expected_outcome?: string;
        verification_steps?: string[];
    }>;
    impact_assessment: z.ZodObject<{
        accessibility_improvement: z.ZodString;
        potential_side_effects: z.ZodArray<z.ZodString, "many">;
        breaking_changes: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        accessibility_improvement?: string;
        potential_side_effects?: string[];
        breaking_changes?: boolean;
    }, {
        accessibility_improvement?: string;
        potential_side_effects?: string[];
        breaking_changes?: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    validation?: {
        test_method?: string;
        expected_outcome?: string;
        verification_steps?: string[];
    };
    implementation?: {
        code_changes?: {
            explanation?: string;
            file_path?: string;
            original_code?: string;
            fixed_code?: string;
        }[];
        css_changes?: {
            explanation?: string;
            selector?: string;
            properties?: Record<string, string>;
        }[];
        attribute_changes?: {
            explanation?: string;
            attributes?: Record<string, string>;
            element_selector?: string;
        }[];
    };
    issue_id?: string;
    fix_type?: "automated" | "manual" | "semi_automated";
    impact_assessment?: {
        accessibility_improvement?: string;
        potential_side_effects?: string[];
        breaking_changes?: boolean;
    };
}, {
    validation?: {
        test_method?: string;
        expected_outcome?: string;
        verification_steps?: string[];
    };
    implementation?: {
        code_changes?: {
            explanation?: string;
            file_path?: string;
            original_code?: string;
            fixed_code?: string;
        }[];
        css_changes?: {
            explanation?: string;
            selector?: string;
            properties?: Record<string, string>;
        }[];
        attribute_changes?: {
            explanation?: string;
            attributes?: Record<string, string>;
            element_selector?: string;
        }[];
    };
    issue_id?: string;
    fix_type?: "automated" | "manual" | "semi_automated";
    impact_assessment?: {
        accessibility_improvement?: string;
        potential_side_effects?: string[];
        breaking_changes?: boolean;
    };
}>;
export declare const AccessibilityReportSchema: z.ZodObject<{
    scan_id: z.ZodString;
    timestamp: z.ZodString;
    project_info: z.ZodObject<{
        name: z.ZodString;
        version: z.ZodString;
        framework: z.ZodString;
        urls_tested: z.ZodArray<z.ZodString, "many">;
        components_tested: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        framework?: string;
        name?: string;
        version?: string;
        urls_tested?: string[];
        components_tested?: string[];
    }, {
        framework?: string;
        name?: string;
        version?: string;
        urls_tested?: string[];
        components_tested?: string[];
    }>;
    test_configuration: z.ZodObject<{
        test_types: z.ZodArray<z.ZodEnum<["automated_scan", "keyboard_navigation", "screen_reader_simulation", "color_contrast_analysis", "focus_management_test", "semantic_structure_validation", "form_accessibility_test", "media_accessibility_test", "motion_accessibility_test"]>, "many">;
        wcag_level: z.ZodEnum<["A", "AA", "AAA"]>;
        browser_targets: z.ZodArray<z.ZodString, "many">;
        assistive_technologies: z.ZodArray<z.ZodString, "many">;
        viewport_sizes: z.ZodArray<z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name?: string;
            width?: number;
            height?: number;
        }, {
            name?: string;
            width?: number;
            height?: number;
        }>, "many">;
        color_vision_simulations: z.ZodArray<z.ZodEnum<["protanopia", "deuteranopia", "tritanopia", "achromatopsia", "protanomaly", "deuteranomaly", "tritanomaly"]>, "many">;
        motion_preferences: z.ZodArray<z.ZodEnum<["reduce", "no-preference"]>, "many">;
        test_environments: z.ZodArray<z.ZodEnum<["development", "staging", "production"]>, "many">;
        reporting_format: z.ZodEnum<["json", "html", "pdf", "csv"]>;
    }, "strip", z.ZodTypeAny, {
        motion_preferences?: ("reduce" | "no-preference")[];
        wcag_level?: "A" | "AA" | "AAA";
        test_types?: ("keyboard_navigation" | "automated_scan" | "screen_reader_simulation" | "color_contrast_analysis" | "focus_management_test" | "semantic_structure_validation" | "form_accessibility_test" | "media_accessibility_test" | "motion_accessibility_test")[];
        browser_targets?: string[];
        assistive_technologies?: string[];
        viewport_sizes?: {
            name?: string;
            width?: number;
            height?: number;
        }[];
        color_vision_simulations?: ("protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia" | "protanomaly" | "deuteranomaly" | "tritanomaly")[];
        test_environments?: ("development" | "staging" | "production")[];
        reporting_format?: "json" | "csv" | "html" | "pdf";
    }, {
        motion_preferences?: ("reduce" | "no-preference")[];
        wcag_level?: "A" | "AA" | "AAA";
        test_types?: ("keyboard_navigation" | "automated_scan" | "screen_reader_simulation" | "color_contrast_analysis" | "focus_management_test" | "semantic_structure_validation" | "form_accessibility_test" | "media_accessibility_test" | "motion_accessibility_test")[];
        browser_targets?: string[];
        assistive_technologies?: string[];
        viewport_sizes?: {
            name?: string;
            width?: number;
            height?: number;
        }[];
        color_vision_simulations?: ("protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia" | "protanomaly" | "deuteranomaly" | "tritanomaly")[];
        test_environments?: ("development" | "staging" | "production")[];
        reporting_format?: "json" | "csv" | "html" | "pdf";
    }>;
    summary: z.ZodObject<{
        total_issues: z.ZodNumber;
        critical_issues: z.ZodNumber;
        serious_issues: z.ZodNumber;
        moderate_issues: z.ZodNumber;
        minor_issues: z.ZodNumber;
        wcag_compliance_level: z.ZodEnum<["A", "AA", "AAA", "non_compliant"]>;
        overall_score: z.ZodNumber;
        automated_fixes_available: z.ZodNumber;
        manual_fixes_required: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total_issues?: number;
        critical_issues?: number;
        serious_issues?: number;
        moderate_issues?: number;
        minor_issues?: number;
        wcag_compliance_level?: "A" | "AA" | "AAA" | "non_compliant";
        overall_score?: number;
        automated_fixes_available?: number;
        manual_fixes_required?: number;
    }, {
        total_issues?: number;
        critical_issues?: number;
        serious_issues?: number;
        moderate_issues?: number;
        minor_issues?: number;
        wcag_compliance_level?: "A" | "AA" | "AAA" | "non_compliant";
        overall_score?: number;
        automated_fixes_available?: number;
        manual_fixes_required?: number;
    }>;
    issues: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["color_contrast", "keyboard_navigation", "screen_reader", "focus_management", "semantic_markup", "aria_labels", "form_accessibility", "image_alt_text", "heading_structure", "link_purpose", "error_identification", "timeout_handling", "motion_preferences"]>;
        severity: z.ZodEnum<["critical", "serious", "moderate", "minor"]>;
        wcag_level: z.ZodEnum<["A", "AA", "AAA"]>;
        wcag_criterion: z.ZodString;
        element: z.ZodObject<{
            tag: z.ZodString;
            selector: z.ZodString;
            xpath: z.ZodString;
            attributes: z.ZodRecord<z.ZodString, z.ZodString>;
            text_content: z.ZodOptional<z.ZodString>;
            computed_styles: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            tag?: string;
            selector?: string;
            xpath?: string;
            attributes?: Record<string, string>;
            text_content?: string;
            computed_styles?: Record<string, string>;
        }, {
            tag?: string;
            selector?: string;
            xpath?: string;
            attributes?: Record<string, string>;
            text_content?: string;
            computed_styles?: Record<string, string>;
        }>;
        description: z.ZodString;
        impact: z.ZodString;
        fix_suggestions: z.ZodArray<z.ZodString, "many">;
        automated_fix_available: z.ZodBoolean;
        code_fix: z.ZodOptional<z.ZodString>;
        test_method: z.ZodString;
        file_path: z.ZodString;
        line_number: z.ZodOptional<z.ZodNumber>;
        column_number: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type?: "color_contrast" | "keyboard_navigation" | "screen_reader" | "focus_management" | "semantic_markup" | "aria_labels" | "form_accessibility" | "image_alt_text" | "heading_structure" | "link_purpose" | "error_identification" | "timeout_handling" | "motion_preferences";
        id?: string;
        description?: string;
        severity?: "critical" | "minor" | "moderate" | "serious";
        impact?: string;
        wcag_level?: "A" | "AA" | "AAA";
        wcag_criterion?: string;
        element?: {
            tag?: string;
            selector?: string;
            xpath?: string;
            attributes?: Record<string, string>;
            text_content?: string;
            computed_styles?: Record<string, string>;
        };
        fix_suggestions?: string[];
        automated_fix_available?: boolean;
        code_fix?: string;
        test_method?: string;
        file_path?: string;
        line_number?: number;
        column_number?: number;
    }, {
        type?: "color_contrast" | "keyboard_navigation" | "screen_reader" | "focus_management" | "semantic_markup" | "aria_labels" | "form_accessibility" | "image_alt_text" | "heading_structure" | "link_purpose" | "error_identification" | "timeout_handling" | "motion_preferences";
        id?: string;
        description?: string;
        severity?: "critical" | "minor" | "moderate" | "serious";
        impact?: string;
        wcag_level?: "A" | "AA" | "AAA";
        wcag_criterion?: string;
        element?: {
            tag?: string;
            selector?: string;
            xpath?: string;
            attributes?: Record<string, string>;
            text_content?: string;
            computed_styles?: Record<string, string>;
        };
        fix_suggestions?: string[];
        automated_fix_available?: boolean;
        code_fix?: string;
        test_method?: string;
        file_path?: string;
        line_number?: number;
        column_number?: number;
    }>, "many">;
    fixes_applied: z.ZodArray<z.ZodObject<{
        issue_id: z.ZodString;
        fix_type: z.ZodEnum<["automated", "semi_automated", "manual"]>;
        implementation: z.ZodObject<{
            code_changes: z.ZodArray<z.ZodObject<{
                file_path: z.ZodString;
                original_code: z.ZodString;
                fixed_code: z.ZodString;
                explanation: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                explanation?: string;
                file_path?: string;
                original_code?: string;
                fixed_code?: string;
            }, {
                explanation?: string;
                file_path?: string;
                original_code?: string;
                fixed_code?: string;
            }>, "many">;
            css_changes: z.ZodArray<z.ZodObject<{
                selector: z.ZodString;
                properties: z.ZodRecord<z.ZodString, z.ZodString>;
                explanation: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                explanation?: string;
                selector?: string;
                properties?: Record<string, string>;
            }, {
                explanation?: string;
                selector?: string;
                properties?: Record<string, string>;
            }>, "many">;
            attribute_changes: z.ZodArray<z.ZodObject<{
                element_selector: z.ZodString;
                attributes: z.ZodRecord<z.ZodString, z.ZodString>;
                explanation: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                explanation?: string;
                attributes?: Record<string, string>;
                element_selector?: string;
            }, {
                explanation?: string;
                attributes?: Record<string, string>;
                element_selector?: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            code_changes?: {
                explanation?: string;
                file_path?: string;
                original_code?: string;
                fixed_code?: string;
            }[];
            css_changes?: {
                explanation?: string;
                selector?: string;
                properties?: Record<string, string>;
            }[];
            attribute_changes?: {
                explanation?: string;
                attributes?: Record<string, string>;
                element_selector?: string;
            }[];
        }, {
            code_changes?: {
                explanation?: string;
                file_path?: string;
                original_code?: string;
                fixed_code?: string;
            }[];
            css_changes?: {
                explanation?: string;
                selector?: string;
                properties?: Record<string, string>;
            }[];
            attribute_changes?: {
                explanation?: string;
                attributes?: Record<string, string>;
                element_selector?: string;
            }[];
        }>;
        validation: z.ZodObject<{
            test_method: z.ZodString;
            expected_outcome: z.ZodString;
            verification_steps: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            test_method?: string;
            expected_outcome?: string;
            verification_steps?: string[];
        }, {
            test_method?: string;
            expected_outcome?: string;
            verification_steps?: string[];
        }>;
        impact_assessment: z.ZodObject<{
            accessibility_improvement: z.ZodString;
            potential_side_effects: z.ZodArray<z.ZodString, "many">;
            breaking_changes: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            accessibility_improvement?: string;
            potential_side_effects?: string[];
            breaking_changes?: boolean;
        }, {
            accessibility_improvement?: string;
            potential_side_effects?: string[];
            breaking_changes?: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        validation?: {
            test_method?: string;
            expected_outcome?: string;
            verification_steps?: string[];
        };
        implementation?: {
            code_changes?: {
                explanation?: string;
                file_path?: string;
                original_code?: string;
                fixed_code?: string;
            }[];
            css_changes?: {
                explanation?: string;
                selector?: string;
                properties?: Record<string, string>;
            }[];
            attribute_changes?: {
                explanation?: string;
                attributes?: Record<string, string>;
                element_selector?: string;
            }[];
        };
        issue_id?: string;
        fix_type?: "automated" | "manual" | "semi_automated";
        impact_assessment?: {
            accessibility_improvement?: string;
            potential_side_effects?: string[];
            breaking_changes?: boolean;
        };
    }, {
        validation?: {
            test_method?: string;
            expected_outcome?: string;
            verification_steps?: string[];
        };
        implementation?: {
            code_changes?: {
                explanation?: string;
                file_path?: string;
                original_code?: string;
                fixed_code?: string;
            }[];
            css_changes?: {
                explanation?: string;
                selector?: string;
                properties?: Record<string, string>;
            }[];
            attribute_changes?: {
                explanation?: string;
                attributes?: Record<string, string>;
                element_selector?: string;
            }[];
        };
        issue_id?: string;
        fix_type?: "automated" | "manual" | "semi_automated";
        impact_assessment?: {
            accessibility_improvement?: string;
            potential_side_effects?: string[];
            breaking_changes?: boolean;
        };
    }>, "many">;
    compliance_analysis: z.ZodObject<{
        wcag_a_compliance: z.ZodNumber;
        wcag_aa_compliance: z.ZodNumber;
        wcag_aaa_compliance: z.ZodNumber;
        section_508_compliance: z.ZodNumber;
        ada_compliance: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        wcag_a_compliance?: number;
        wcag_aa_compliance?: number;
        wcag_aaa_compliance?: number;
        section_508_compliance?: number;
        ada_compliance?: number;
    }, {
        wcag_a_compliance?: number;
        wcag_aa_compliance?: number;
        wcag_aaa_compliance?: number;
        section_508_compliance?: number;
        ada_compliance?: number;
    }>;
    recommendations: z.ZodArray<z.ZodObject<{
        category: z.ZodString;
        priority: z.ZodEnum<["high", "medium", "low"]>;
        description: z.ZodString;
        implementation_guide: z.ZodString;
        resources: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        priority?: "low" | "medium" | "high";
        description?: string;
        category?: string;
        implementation_guide?: string;
        resources?: string[];
    }, {
        priority?: "low" | "medium" | "high";
        description?: string;
        category?: string;
        implementation_guide?: string;
        resources?: string[];
    }>, "many">;
    performance_impact: z.ZodObject<{
        scan_duration_ms: z.ZodNumber;
        pages_per_second: z.ZodNumber;
        memory_usage_mb: z.ZodNumber;
        cpu_usage_percent: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        scan_duration_ms?: number;
        pages_per_second?: number;
        memory_usage_mb?: number;
        cpu_usage_percent?: number;
    }, {
        scan_duration_ms?: number;
        pages_per_second?: number;
        memory_usage_mb?: number;
        cpu_usage_percent?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    issues?: {
        type?: "color_contrast" | "keyboard_navigation" | "screen_reader" | "focus_management" | "semantic_markup" | "aria_labels" | "form_accessibility" | "image_alt_text" | "heading_structure" | "link_purpose" | "error_identification" | "timeout_handling" | "motion_preferences";
        id?: string;
        description?: string;
        severity?: "critical" | "minor" | "moderate" | "serious";
        impact?: string;
        wcag_level?: "A" | "AA" | "AAA";
        wcag_criterion?: string;
        element?: {
            tag?: string;
            selector?: string;
            xpath?: string;
            attributes?: Record<string, string>;
            text_content?: string;
            computed_styles?: Record<string, string>;
        };
        fix_suggestions?: string[];
        automated_fix_available?: boolean;
        code_fix?: string;
        test_method?: string;
        file_path?: string;
        line_number?: number;
        column_number?: number;
    }[];
    timestamp?: string;
    recommendations?: {
        priority?: "low" | "medium" | "high";
        description?: string;
        category?: string;
        implementation_guide?: string;
        resources?: string[];
    }[];
    summary?: {
        total_issues?: number;
        critical_issues?: number;
        serious_issues?: number;
        moderate_issues?: number;
        minor_issues?: number;
        wcag_compliance_level?: "A" | "AA" | "AAA" | "non_compliant";
        overall_score?: number;
        automated_fixes_available?: number;
        manual_fixes_required?: number;
    };
    scan_id?: string;
    project_info?: {
        framework?: string;
        name?: string;
        version?: string;
        urls_tested?: string[];
        components_tested?: string[];
    };
    test_configuration?: {
        motion_preferences?: ("reduce" | "no-preference")[];
        wcag_level?: "A" | "AA" | "AAA";
        test_types?: ("keyboard_navigation" | "automated_scan" | "screen_reader_simulation" | "color_contrast_analysis" | "focus_management_test" | "semantic_structure_validation" | "form_accessibility_test" | "media_accessibility_test" | "motion_accessibility_test")[];
        browser_targets?: string[];
        assistive_technologies?: string[];
        viewport_sizes?: {
            name?: string;
            width?: number;
            height?: number;
        }[];
        color_vision_simulations?: ("protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia" | "protanomaly" | "deuteranomaly" | "tritanomaly")[];
        test_environments?: ("development" | "staging" | "production")[];
        reporting_format?: "json" | "csv" | "html" | "pdf";
    };
    fixes_applied?: {
        validation?: {
            test_method?: string;
            expected_outcome?: string;
            verification_steps?: string[];
        };
        implementation?: {
            code_changes?: {
                explanation?: string;
                file_path?: string;
                original_code?: string;
                fixed_code?: string;
            }[];
            css_changes?: {
                explanation?: string;
                selector?: string;
                properties?: Record<string, string>;
            }[];
            attribute_changes?: {
                explanation?: string;
                attributes?: Record<string, string>;
                element_selector?: string;
            }[];
        };
        issue_id?: string;
        fix_type?: "automated" | "manual" | "semi_automated";
        impact_assessment?: {
            accessibility_improvement?: string;
            potential_side_effects?: string[];
            breaking_changes?: boolean;
        };
    }[];
    compliance_analysis?: {
        wcag_a_compliance?: number;
        wcag_aa_compliance?: number;
        wcag_aaa_compliance?: number;
        section_508_compliance?: number;
        ada_compliance?: number;
    };
    performance_impact?: {
        scan_duration_ms?: number;
        pages_per_second?: number;
        memory_usage_mb?: number;
        cpu_usage_percent?: number;
    };
}, {
    issues?: {
        type?: "color_contrast" | "keyboard_navigation" | "screen_reader" | "focus_management" | "semantic_markup" | "aria_labels" | "form_accessibility" | "image_alt_text" | "heading_structure" | "link_purpose" | "error_identification" | "timeout_handling" | "motion_preferences";
        id?: string;
        description?: string;
        severity?: "critical" | "minor" | "moderate" | "serious";
        impact?: string;
        wcag_level?: "A" | "AA" | "AAA";
        wcag_criterion?: string;
        element?: {
            tag?: string;
            selector?: string;
            xpath?: string;
            attributes?: Record<string, string>;
            text_content?: string;
            computed_styles?: Record<string, string>;
        };
        fix_suggestions?: string[];
        automated_fix_available?: boolean;
        code_fix?: string;
        test_method?: string;
        file_path?: string;
        line_number?: number;
        column_number?: number;
    }[];
    timestamp?: string;
    recommendations?: {
        priority?: "low" | "medium" | "high";
        description?: string;
        category?: string;
        implementation_guide?: string;
        resources?: string[];
    }[];
    summary?: {
        total_issues?: number;
        critical_issues?: number;
        serious_issues?: number;
        moderate_issues?: number;
        minor_issues?: number;
        wcag_compliance_level?: "A" | "AA" | "AAA" | "non_compliant";
        overall_score?: number;
        automated_fixes_available?: number;
        manual_fixes_required?: number;
    };
    scan_id?: string;
    project_info?: {
        framework?: string;
        name?: string;
        version?: string;
        urls_tested?: string[];
        components_tested?: string[];
    };
    test_configuration?: {
        motion_preferences?: ("reduce" | "no-preference")[];
        wcag_level?: "A" | "AA" | "AAA";
        test_types?: ("keyboard_navigation" | "automated_scan" | "screen_reader_simulation" | "color_contrast_analysis" | "focus_management_test" | "semantic_structure_validation" | "form_accessibility_test" | "media_accessibility_test" | "motion_accessibility_test")[];
        browser_targets?: string[];
        assistive_technologies?: string[];
        viewport_sizes?: {
            name?: string;
            width?: number;
            height?: number;
        }[];
        color_vision_simulations?: ("protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia" | "protanomaly" | "deuteranomaly" | "tritanomaly")[];
        test_environments?: ("development" | "staging" | "production")[];
        reporting_format?: "json" | "csv" | "html" | "pdf";
    };
    fixes_applied?: {
        validation?: {
            test_method?: string;
            expected_outcome?: string;
            verification_steps?: string[];
        };
        implementation?: {
            code_changes?: {
                explanation?: string;
                file_path?: string;
                original_code?: string;
                fixed_code?: string;
            }[];
            css_changes?: {
                explanation?: string;
                selector?: string;
                properties?: Record<string, string>;
            }[];
            attribute_changes?: {
                explanation?: string;
                attributes?: Record<string, string>;
                element_selector?: string;
            }[];
        };
        issue_id?: string;
        fix_type?: "automated" | "manual" | "semi_automated";
        impact_assessment?: {
            accessibility_improvement?: string;
            potential_side_effects?: string[];
            breaking_changes?: boolean;
        };
    }[];
    compliance_analysis?: {
        wcag_a_compliance?: number;
        wcag_aa_compliance?: number;
        wcag_aaa_compliance?: number;
        section_508_compliance?: number;
        ada_compliance?: number;
    };
    performance_impact?: {
        scan_duration_ms?: number;
        pages_per_second?: number;
        memory_usage_mb?: number;
        cpu_usage_percent?: number;
    };
}>;
export type AccessibilityIssue = z.infer<typeof AccessibilityIssueSchema>;
export type AccessibilityTestConfig = z.infer<typeof AccessibilityTestConfigSchema>;
export type AccessibilityFix = z.infer<typeof AccessibilityFixSchema>;
export type AccessibilityReport = z.infer<typeof AccessibilityReportSchema>;
export declare class AutonomousAccessibilityGuardian extends EventEmitter {
    private scanHistory;
    private issueDatabase;
    private fixTemplates;
    private testConfig;
    constructor(config?: Partial<AccessibilityTestConfig>);
    private initializeDefaultConfig;
    private initializeFixTemplates;
    private setupEventHandlers;
    scanProject(projectPath: string, options?: Partial<AccessibilityTestConfig>): Promise<AccessibilityReport>;
    private runAutomatedScan;
    private testKeyboardNavigation;
    private testScreenReaderCompatibility;
    private analyzeColorContrast;
    private testFocusManagement;
    private validateSemanticStructure;
    private applyAutomatedFixes;
    private generateAndApplyFix;
    private generateAccessibilityReport;
    private generateSummary;
    private analyzeCompliance;
    private generateRecommendations;
    private generateFixSuggestions;
    private generateCodeFix;
    private calculateContrastRatio;
    private generateContrastCompliantColor;
    private requiresAriaLabel;
    private generateAriaLabel;
    private isInteractiveElement;
    private determineAppropriateRole;
    private hasSemanticMarkupIssues;
    private hasFormAccessibilityIssues;
    private extractOriginalElement;
    private generateSemanticMarkup;
    private extractFormElement;
    private generateAccessibleForm;
    private generateContrastFix;
    private generateSemanticFix;
    private assessAccessibilityImprovement;
    private assessPotentialSideEffects;
    private handleScanStarted;
    private handleIssueDetected;
    private handleFixApplied;
    private handleScanCompleted;
    private generateScanId;
    private generateIssueId;
    generateAccessibilityChecklist(wcagLevel?: 'A' | 'AA' | 'AAA'): Promise<any>;
    private getPerceivableCriteria;
    private getOperableCriteria;
    private getUnderstandableCriteria;
    private getRobustCriteria;
    getRecentScans(limit?: number): AccessibilityReport[];
    getScanById(scanId: string): AccessibilityReport | undefined;
    getIssueById(issueId: string): AccessibilityIssue | undefined;
    exportReport(scanId: string, format: 'json' | 'html' | 'pdf' | 'csv'): Promise<string>;
    private generateHTMLReport;
    private generateCSVReport;
    private generatePDFReport;
}
export default AutonomousAccessibilityGuardian;
