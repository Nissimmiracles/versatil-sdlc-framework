/**
 * Design System Guardian
 * Enforces design consistency across all UI components
 * Prevents design drift and maintains brand integrity
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join } from 'path';
import { vectorMemoryStore } from '../rag/vector-memory-store.js';

export interface DesignSystem {
  colors: {
    primary: string[];
    secondary: string[];
    neutral: string[];
    semantic: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  typography: {
    fontFamilies: {
      heading: string;
      body: string;
      mono: string;
    };
    fontSizes: Record<string, string>;
    fontWeights: Record<string, number>;
    lineHeights: Record<string, number>;
  };
  spacing: {
    base: number;
    scale: number[];
  };
  breakpoints: Record<string, string>;
  components: DesignComponent[];
  accessibility: {
    minContrastRatio: number;
    minTouchTarget: string;
    wcagLevel: 'A' | 'AA' | 'AAA';
  };
}

export interface DesignComponent {
  name: string;
  variants: string[];
  allowedColors: string[];
  allowedSizes: string[];
  requiredProps: string[];
  accessibilityRules: string[];
}

export interface DesignViolation {
  type: 'color' | 'spacing' | 'typography' | 'component' | 'accessibility';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location: string;
  suggestion: string;
  autoFix?: string;
}

export interface DesignCheckResult {
  compliant: boolean;
  violations: DesignViolation[];
  score: number; // 0-100
  suggestions: string[];
}

export class DesignSystemGuardian extends EventEmitter {
  private designSystem: DesignSystem | null = null;
  private designSystemPath: string;

  constructor(projectPath: string = process.cwd()) {
    super();
    this.designSystemPath = join(projectPath, 'docs', 'context', 'DESIGN_PRINCIPLES.md');
  }

  /**
   * Initialize design system guardian
   */
  async initialize(): Promise<void> {
    try {
      await this.loadDesignSystem();

      if (!this.designSystem) {
        console.log('🎨 No DESIGN_PRINCIPLES.md found, creating template...');
        await this.createDesignSystemTemplate();
      }

      console.log('🎨 Design System Guardian initialized');
      this.emit('initialized', { designSystem: this.designSystem });
    } catch (error: any) {
      console.error('❌ Failed to initialize Design System Guardian:', error.message);
      throw error;
    }
  }

  /**
   * Load design system from markdown file
   */
  async loadDesignSystem(): Promise<DesignSystem | null> {
    try {
      const content = await fs.readFile(this.designSystemPath, 'utf-8');
      this.designSystem = this.parseDesignSystemFromMarkdown(content);

      // Store in RAG for querying
      await vectorMemoryStore.storeMemory({
        content: JSON.stringify(this.designSystem),
        metadata: {
          documentType: 'design_system',
          timestamp: Date.now(),
          tags: ['design', 'ui', 'components', 'accessibility'],
          priority: 'high'
        }
      });

      return this.designSystem;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if code adheres to design system
   */
  async checkDesignCompliance(
    code: string,
    filePath: string,
    componentType?: string
  ): Promise<DesignCheckResult> {
    if (!this.designSystem) {
      await this.loadDesignSystem();
    }

    if (!this.designSystem) {
      return {
        compliant: true,
        violations: [],
        score: 0,
        suggestions: ['No design system defined - create DESIGN_PRINCIPLES.md']
      };
    }

    console.log(`🔍 Checking design compliance: ${filePath}`);

    const violations: DesignViolation[] = [];

    // Check color violations
    violations.push(...this.checkColorViolations(code, filePath));

    // Check spacing violations
    violations.push(...this.checkSpacingViolations(code, filePath));

    // Check typography violations
    violations.push(...this.checkTypographyViolations(code, filePath));

    // Check component violations
    if (componentType) {
      violations.push(...this.checkComponentViolations(code, filePath, componentType));
    }

    // Check accessibility violations
    violations.push(...this.checkAccessibilityViolations(code, filePath));

    // Calculate compliance score
    const score = this.calculateComplianceScore(violations);
    const compliant = score >= 90; // 90% minimum

    const suggestions = this.generateDesignSuggestions(violations);

    const result: DesignCheckResult = {
      compliant,
      violations,
      score,
      suggestions
    };

    // Store compliance check in RAG
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify({
        filePath,
        result,
        timestamp: Date.now()
      }),
      metadata: {
        documentType: 'design_compliance_check',
        compliant,
        score,
        violationCount: violations.length,
        tags: ['design', 'compliance', 'check'],
        timestamp: Date.now()
      }
    });

    this.emit('compliance_checked', { filePath, result });

    return result;
  }

  /**
   * Check color violations
   */
  private checkColorViolations(code: string, filePath: string): DesignViolation[] {
    const violations: DesignViolation[] = [];

    if (!this.designSystem) return violations;

    // Check for hardcoded colors (hex, rgb, etc.)
    const colorPatterns = [
      /#[0-9A-Fa-f]{6}/g, // Hex colors
      /rgb\([^)]+\)/g, // RGB colors
      /rgba\([^)]+\)/g, // RGBA colors
      /hsl\([^)]+\)/g // HSL colors
    ];

    for (const pattern of colorPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        for (const color of matches) {
          // Check if color is in design system
          if (!this.isApprovedColor(color)) {
            violations.push({
              type: 'color',
              severity: 'high',
              description: `Hardcoded color not in design system: ${color}`,
              location: filePath,
              suggestion: 'Use design system color variable (e.g., colors.primary[500])',
              autoFix: this.suggestApprovedColor(color)
            });
          }
        }
      }
    }

    // Check for inline styles with colors
    const inlineStyleMatches = code.match(/style={{[^}]*color[^}]*}}/g);
    if (inlineStyleMatches) {
      violations.push({
        type: 'color',
        severity: 'medium',
        description: 'Inline styles detected with color property',
        location: filePath,
        suggestion: 'Use Tailwind CSS classes or styled-components'
      });
    }

    return violations;
  }

  /**
   * Check spacing violations
   */
  private checkSpacingViolations(code: string, filePath: string): DesignViolation[] {
    const violations: DesignViolation[] = [];

    if (!this.designSystem) return violations;

    // Check for hardcoded spacing values
    const spacingPattern = /(margin|padding|gap):\s*['"`]?(\d+)(px|rem|em)/g;
    const matches = code.matchAll(spacingPattern);

    for (const match of matches) {
      const value = parseInt(match[2]);
      const unit = match[3];

      // Check if value aligns with spacing scale
      if (unit === 'px' && !this.designSystem.spacing.scale.includes(value)) {
        violations.push({
          type: 'spacing',
          severity: 'medium',
          description: `Non-standard spacing value: ${value}px`,
          location: filePath,
          suggestion: `Use spacing scale: ${this.designSystem.spacing.scale.join(', ')}px`,
          autoFix: this.suggestClosestSpacing(value)
        });
      }
    }

    // Check for arbitrary Tailwind values
    const arbitraryPattern = /\[(\d+)px\]/g;
    const arbitraryMatches = code.matchAll(arbitraryPattern);

    for (const match of arbitraryMatches) {
      const value = parseInt(match[1]);

      if (!this.designSystem.spacing.scale.includes(value)) {
        violations.push({
          type: 'spacing',
          severity: 'medium',
          description: `Arbitrary Tailwind spacing: [${value}px]`,
          location: filePath,
          suggestion: 'Use standard Tailwind spacing scale (e.g., p-4, m-8)',
          autoFix: this.convertToTailwindSpacing(value)
        });
      }
    }

    return violations;
  }

  /**
   * Check typography violations
   */
  private checkTypographyViolations(code: string, filePath: string): DesignViolation[] {
    const violations: DesignViolation[] = [];

    if (!this.designSystem) return violations;

    // Check for hardcoded font families
    const fontFamilyPattern = /font-family:\s*['"`]([^'"`]+)['"`]/g;
    const matches = code.matchAll(fontFamilyPattern);

    for (const match of matches) {
      const fontFamily = match[1];

      if (!this.isApprovedFontFamily(fontFamily)) {
        violations.push({
          type: 'typography',
          severity: 'high',
          description: `Unapproved font family: ${fontFamily}`,
          location: filePath,
          suggestion: `Use design system fonts: ${Object.values(this.designSystem.typography.fontFamilies).join(', ')}`
        });
      }
    }

    // Check for hardcoded font sizes
    const fontSizePattern = /font-size:\s*(\d+)(px|rem|em)/g;
    const sizeMatches = code.matchAll(fontSizePattern);

    for (const match of sizeMatches) {
      const size = match[1] + match[2];

      if (!this.isApprovedFontSize(size)) {
        violations.push({
          type: 'typography',
          severity: 'medium',
          description: `Non-standard font size: ${size}`,
          location: filePath,
          suggestion: 'Use design system font sizes (e.g., text-base, text-lg)'
        });
      }
    }

    return violations;
  }

  /**
   * Check component violations
   */
  private checkComponentViolations(
    code: string,
    filePath: string,
    componentType: string
  ): DesignViolation[] {
    const violations: DesignViolation[] = [];

    if (!this.designSystem) return violations;

    const component = this.designSystem.components.find(c => c.name === componentType);

    if (!component) {
      return violations;
    }

    // Check required props
    for (const requiredProp of component.requiredProps) {
      const propPattern = new RegExp(`${requiredProp}=`, 'g');

      if (!propPattern.test(code)) {
        violations.push({
          type: 'component',
          severity: 'critical',
          description: `Missing required prop: ${requiredProp}`,
          location: filePath,
          suggestion: `Add ${requiredProp} prop to ${componentType}`
        });
      }
    }

    // Check variant usage
    const variantPattern = /variant=['"`]([^'"`]+)['"`]/g;
    const variantMatches = code.matchAll(variantPattern);

    for (const match of variantMatches) {
      const variant = match[1];

      if (!component.variants.includes(variant)) {
        violations.push({
          type: 'component',
          severity: 'high',
          description: `Invalid variant: ${variant}`,
          location: filePath,
          suggestion: `Use approved variants: ${component.variants.join(', ')}`
        });
      }
    }

    return violations;
  }

  /**
   * Check accessibility violations
   */
  private checkAccessibilityViolations(code: string, filePath: string): DesignViolation[] {
    const violations: DesignViolation[] = [];

    if (!this.designSystem) return violations;

    // Check for missing alt text on images
    if (/<img[^>]*>/.test(code) && !/<img[^>]*alt=/.test(code)) {
      violations.push({
        type: 'accessibility',
        severity: 'critical',
        description: 'Image missing alt attribute',
        location: filePath,
        suggestion: 'Add descriptive alt text to all images'
      });
    }

    // Check for buttons without accessible labels
    const buttonPattern = /<button[^>]*>.*?<\/button>/g;
    const buttonMatches = code.match(buttonPattern);

    if (buttonMatches) {
      for (const button of buttonMatches) {
        if (!button.includes('aria-label') && /<button[^>]*>[\s]*<\/button>/.test(button)) {
          violations.push({
            type: 'accessibility',
            severity: 'high',
            description: 'Button without text or aria-label',
            location: filePath,
            suggestion: 'Add aria-label or visible text to button'
          });
        }
      }
    }

    // Check for form inputs without labels
    const inputPattern = /<input[^>]*>/g;
    const inputMatches = code.match(inputPattern);

    if (inputMatches) {
      for (const input of inputMatches) {
        if (!input.includes('aria-label') && !input.includes('id=')) {
          violations.push({
            type: 'accessibility',
            severity: 'high',
            description: 'Form input without label or aria-label',
            location: filePath,
            suggestion: 'Associate input with label or add aria-label'
          });
        }
      }
    }

    // Check for low contrast colors
    const contrastPattern = /text-([a-z]+)-(\d+)/g;
    const contrastMatches = code.matchAll(contrastPattern);

    for (const match of contrastMatches) {
      const color = match[1];
      const shade = parseInt(match[2]);

      // Light colors on white background = low contrast
      if (shade < 400) {
        violations.push({
          type: 'accessibility',
          severity: 'medium',
          description: `Potential low contrast: text-${color}-${shade}`,
          location: filePath,
          suggestion: `Use darker shade (e.g., text-${color}-600) for better contrast`
        });
      }
    }

    return violations;
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(violations: DesignViolation[]): number {
    if (violations.length === 0) {
      return 100;
    }

    // Weighted scoring
    let penalty = 0;

    for (const violation of violations) {
      switch (violation.severity) {
        case 'critical':
          penalty += 20;
          break;
        case 'high':
          penalty += 10;
          break;
        case 'medium':
          penalty += 5;
          break;
        case 'low':
          penalty += 2;
          break;
      }
    }

    const score = Math.max(0, 100 - penalty);
    return score;
  }

  /**
   * Generate design suggestions
   */
  private generateDesignSuggestions(violations: DesignViolation[]): string[] {
    const suggestions: string[] = [];

    if (violations.length === 0) {
      suggestions.push('✅ Perfect design compliance!');
      return suggestions;
    }

    // Group violations by type
    const byType: Record<string, number> = {};

    for (const violation of violations) {
      byType[violation.type] = (byType[violation.type] || 0) + 1;
    }

    // Add type-specific suggestions
    for (const [type, count] of Object.entries(byType)) {
      suggestions.push(`⚠️ ${count} ${type} violation${count > 1 ? 's' : ''} detected`);

      switch (type) {
        case 'color':
          suggestions.push('💡 Use design system color variables or Tailwind CSS classes');
          break;
        case 'spacing':
          suggestions.push('💡 Align spacing with design system scale');
          break;
        case 'typography':
          suggestions.push('💡 Use design system font families and sizes');
          break;
        case 'component':
          suggestions.push('💡 Follow component prop requirements and variant usage');
          break;
        case 'accessibility':
          suggestions.push('💡 Ensure WCAG 2.1 AA compliance (alt text, labels, contrast)');
          break;
      }
    }

    return suggestions;
  }

  /**
   * Check if color is approved
   */
  private isApprovedColor(color: string): boolean {
    if (!this.designSystem) return false;

    // Normalize color
    const normalized = color.toLowerCase();

    // Check in color palettes
    const allColors = [
      ...this.designSystem.colors.primary,
      ...this.designSystem.colors.secondary,
      ...this.designSystem.colors.neutral,
      ...Object.values(this.designSystem.colors.semantic)
    ];

    return allColors.some(c => c.toLowerCase() === normalized);
  }

  /**
   * Suggest approved color
   */
  private suggestApprovedColor(color: string): string {
    if (!this.designSystem) return '';

    // Simple color matching (could be enhanced with color distance algorithms)
    return `Use colors.primary[500] or appropriate design system color`;
  }

  /**
   * Suggest closest spacing value
   */
  private suggestClosestSpacing(value: number): string {
    if (!this.designSystem) return '';

    const scale = this.designSystem.spacing.scale;
    const closest = scale.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );

    return `${closest}px`;
  }

  /**
   * Convert to Tailwind spacing
   */
  private convertToTailwindSpacing(value: number): string {
    if (!this.designSystem) return '';

    const base = this.designSystem.spacing.base;
    const units = value / base;

    return `p-${units} or m-${units}`;
  }

  /**
   * Check if font family is approved
   */
  private isApprovedFontFamily(fontFamily: string): boolean {
    if (!this.designSystem) return false;

    const approved = Object.values(this.designSystem.typography.fontFamilies);
    return approved.some(f => fontFamily.includes(f));
  }

  /**
   * Check if font size is approved
   */
  private isApprovedFontSize(size: string): boolean {
    if (!this.designSystem) return false;

    const approved = Object.values(this.designSystem.typography.fontSizes);
    return approved.includes(size);
  }

  /**
   * Parse design system from markdown
   */
  private parseDesignSystemFromMarkdown(content: string): DesignSystem {
    // Simplified parsing - would be more robust in production
    const designSystem: DesignSystem = {
      colors: {
        primary: [],
        secondary: [],
        neutral: [],
        semantic: {
          success: '',
          warning: '',
          error: '',
          info: ''
        }
      },
      typography: {
        fontFamilies: {
          heading: '',
          body: '',
          mono: ''
        },
        fontSizes: {},
        fontWeights: {},
        lineHeights: {}
      },
      spacing: {
        base: 4,
        scale: [4, 8, 12, 16, 24, 32, 48, 64]
      },
      breakpoints: {},
      components: [],
      accessibility: {
        minContrastRatio: 4.5,
        minTouchTarget: '44px',
        wcagLevel: 'AA'
      }
    };

    return designSystem;
  }

  /**
   * Create design system template
   */
  private async createDesignSystemTemplate(): Promise<void> {
    const template = `# Design System Principles

**Last Updated**: ${new Date().toISOString()}

## 🎨 Color Palette

### Primary Colors
- \`#3B82F6\` - Primary (Blue 500)
- \`#2563EB\` - Primary Dark (Blue 600)
- \`#60A5FA\` - Primary Light (Blue 400)

### Secondary Colors
- \`#8B5CF6\` - Secondary (Purple 500)
- \`#A78BFA\` - Secondary Light (Purple 400)

### Neutral Colors
- \`#111827\` - Gray 900 (Text Primary)
- \`#6B7280\` - Gray 500 (Text Secondary)
- \`#F3F4F6\` - Gray 100 (Background)

### Semantic Colors
- **Success**: \`#10B981\` (Green 500)
- **Warning**: \`#F59E0B\` (Amber 500)
- **Error**: \`#EF4444\` (Red 500)
- **Info**: \`#3B82F6\` (Blue 500)

## 📐 Spacing Scale

**Base**: 4px

**Scale**: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128

**Usage**: Always use values from the scale. No arbitrary spacing.

## 🔤 Typography

### Font Families
- **Heading**: Inter
- **Body**: Roboto
- **Mono**: Fira Code

### Font Sizes
- \`text-xs\`: 12px
- \`text-sm\`: 14px
- \`text-base\`: 16px
- \`text-lg\`: 18px
- \`text-xl\`: 20px
- \`text-2xl\`: 24px
- \`text-3xl\`: 30px
- \`text-4xl\`: 36px

### Font Weights
- \`font-normal\`: 400
- \`font-medium\`: 500
- \`font-semibold\`: 600
- \`font-bold\`: 700

## 📱 Responsive Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## ♿ Accessibility

### Requirements
- **WCAG Level**: AA (minimum)
- **Min Contrast Ratio**: 4.5:1 (normal text), 3:1 (large text)
- **Min Touch Target**: 44px x 44px
- **Keyboard Navigation**: All interactive elements must be keyboard accessible

### Rules
- All images must have \`alt\` text
- All buttons must have visible text or \`aria-label\`
- All form inputs must have associated labels
- Color must not be the only means of conveying information

## 🧩 Component Guidelines

### Button Component
- **Variants**: \`primary\`, \`secondary\`, \`outline\`, \`ghost\`, \`link\`
- **Sizes**: \`sm\`, \`md\`, \`lg\`
- **Required Props**: \`children\` or \`aria-label\`
- **Accessibility**: Must have focus states, keyboard support

### Input Component
- **Variants**: \`default\`, \`error\`, \`success\`
- **Required Props**: \`id\`, \`label\` or \`aria-label\`
- **Accessibility**: Label association, error messages

---

**Auto-Generated by VERSATIL Design System Guardian**
`;

    await fs.mkdir(join(this.designSystemPath, '..'), { recursive: true });
    await fs.writeFile(this.designSystemPath, template, 'utf-8');

    // Parse template
    this.designSystem = this.parseDesignSystemFromMarkdown(template);

    console.log(`✅ Created design system template: ${this.designSystemPath}`);
  }

  /**
   * Get current design system
   */
  getDesignSystem(): DesignSystem | null {
    return this.designSystem;
  }
}

// Export singleton
export const designSystemGuardian = new DesignSystemGuardian();
