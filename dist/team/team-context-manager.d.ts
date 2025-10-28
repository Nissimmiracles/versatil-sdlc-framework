/**
 * VERSATIL SDLC Framework - Team Context Manager
 *
 * Manages team conventions, standards, and membership
 * Part of Layer 3 (User/Team Context) - Task 7
 *
 * Storage: ~/.versatil/teams/[team-id]/conventions.json
 *
 * Features:
 * - Team coding conventions
 * - Code review policies
 * - Testing policies
 * - Team membership management
 * - Branching strategies
 */
import { EventEmitter } from 'events';
export interface CodeReviewPolicy {
    required: boolean;
    minApprovals: number;
    requiredReviewers?: string[];
    autoApproveOwner: boolean;
    blockOnFailedTests: boolean;
    blockOnFailedLint: boolean;
}
export interface TestingPolicy {
    required: boolean;
    minCoverage: number;
    requiredTests: ('unit' | 'integration' | 'e2e')[];
    blockOnFailure: boolean;
    autoRunOnPR: boolean;
}
export interface BranchingStrategy {
    type: 'gitflow' | 'github-flow' | 'trunk-based' | 'custom';
    mainBranch: string;
    developBranch?: string;
    featureBranchPrefix: string;
    releaseBranchPrefix?: string;
    hotfixBranchPrefix?: string;
    requirePRForMain: boolean;
    requirePRForDevelop?: boolean;
}
export interface TeamConventions {
    codeStyle: 'airbnb' | 'google' | 'standard' | 'custom';
    formatter: 'prettier' | 'eslint' | 'none';
    linter: 'eslint' | 'tslint' | 'none';
    commitStyle: 'conventional' | 'angular' | 'custom';
    commitMessageFormat?: string;
    requireIssueReference: boolean;
    branchingStrategy: BranchingStrategy;
    reviewPolicy: CodeReviewPolicy;
    testingPolicy: TestingPolicy;
    requireDocstrings: boolean;
    docStyle: 'jsdoc' | 'typedoc' | 'sphinx' | 'custom';
    deploymentStrategy: 'manual' | 'auto-staging' | 'auto-production' | 'cd';
    deploymentApprovers?: string[];
    customRules?: Record<string, any>;
}
export interface TeamMember {
    userId: string;
    role: 'owner' | 'admin' | 'developer' | 'viewer';
    joinedAt: number;
    permissions: {
        canApproveDeployments: boolean;
        canModifyConventions: boolean;
        canInviteMembers: boolean;
        canRemoveMembers: boolean;
    };
}
export interface TeamProfile {
    teamId: string;
    name: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
    ownerId: string;
}
export interface TeamContext {
    profile: TeamProfile;
    conventions: TeamConventions;
    members: TeamMember[];
}
export declare class TeamContextManager extends EventEmitter {
    private versatilHome;
    private teamsPath;
    constructor();
    /**
     * Initialize team directory
     */
    private ensureTeamDir;
    /**
     * Create new team with owner
     */
    createTeam(teamId: string, name: string, ownerId: string, description?: string, conventions?: Partial<TeamConventions>): Promise<TeamContext>;
    /**
     * Get team context (profile + conventions + members)
     */
    getTeamContext(teamId: string): Promise<TeamContext | null>;
    /**
     * Update team conventions
     */
    updateConventions(teamId: string, conventions: Partial<TeamConventions>, modifiedBy: string): Promise<void>;
    /**
     * Add team member
     */
    addTeamMember(teamId: string, userId: string, role: TeamMember['role'], invitedBy: string): Promise<void>;
    /**
     * Remove team member
     */
    removeTeamMember(teamId: string, userId: string, removedBy: string): Promise<void>;
    /**
     * Update member role
     */
    updateMemberRole(teamId: string, userId: string, newRole: TeamMember['role'], updatedBy: string): Promise<void>;
    /**
     * Check if team exists
     */
    teamExists(teamId: string): Promise<boolean>;
    /**
     * Delete team
     */
    deleteTeam(teamId: string, deletedBy: string): Promise<void>;
    /**
     * List all teams
     */
    listTeams(): Promise<TeamProfile[]>;
    /**
     * Get teams for a user
     */
    getUserTeams(userId: string): Promise<TeamContext[]>;
    /**
     * Get role permissions
     */
    private getRolePermissions;
    /**
     * Get default team conventions
     */
    private getDefaultConventions;
}
export declare const teamContextManager: TeamContextManager;
