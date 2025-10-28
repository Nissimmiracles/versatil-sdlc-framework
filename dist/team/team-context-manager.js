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
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
// ==================== TEAM CONTEXT MANAGER ====================
export class TeamContextManager extends EventEmitter {
    constructor() {
        super();
        this.versatilHome = join(homedir(), '.versatil');
        this.teamsPath = join(this.versatilHome, 'teams');
    }
    /**
     * Initialize team directory
     */
    async ensureTeamDir(teamId) {
        const teamDir = join(this.teamsPath, teamId);
        await fs.mkdir(teamDir, { recursive: true });
        return teamDir;
    }
    /**
     * Create new team with owner
     */
    async createTeam(teamId, name, ownerId, description, conventions) {
        const teamDir = await this.ensureTeamDir(teamId);
        const conventionsPath = join(teamDir, 'conventions.json');
        // Check if team already exists
        const exists = await this.teamExists(teamId);
        if (exists) {
            throw new Error(`Team ${teamId} already exists`);
        }
        const now = Date.now();
        const teamContext = {
            profile: {
                teamId,
                name,
                description,
                ownerId,
                createdAt: now,
                updatedAt: now
            },
            conventions: {
                ...this.getDefaultConventions(),
                ...conventions
            },
            members: [
                {
                    userId: ownerId,
                    role: 'owner',
                    joinedAt: now,
                    permissions: {
                        canApproveDeployments: true,
                        canModifyConventions: true,
                        canInviteMembers: true,
                        canRemoveMembers: true
                    }
                }
            ]
        };
        await fs.writeFile(conventionsPath, JSON.stringify(teamContext, null, 2));
        this.emit('team_created', { teamId, profile: teamContext.profile });
        console.log(`✅ Team created: ${teamId} (${name})`);
        return teamContext;
    }
    /**
     * Get team context (profile + conventions + members)
     */
    async getTeamContext(teamId) {
        try {
            const conventionsPath = join(this.teamsPath, teamId, 'conventions.json');
            const data = await fs.readFile(conventionsPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    /**
     * Update team conventions
     */
    async updateConventions(teamId, conventions, modifiedBy) {
        const context = await this.getTeamContext(teamId);
        if (!context) {
            throw new Error(`Team ${teamId} not found`);
        }
        // Check permissions
        const member = context.members.find(m => m.userId === modifiedBy);
        if (!member || !member.permissions.canModifyConventions) {
            throw new Error(`User ${modifiedBy} does not have permission to modify conventions`);
        }
        // Merge conventions
        context.conventions = {
            ...context.conventions,
            ...conventions
        };
        context.profile.updatedAt = Date.now();
        const conventionsPath = join(this.teamsPath, teamId, 'conventions.json');
        await fs.writeFile(conventionsPath, JSON.stringify(context, null, 2));
        this.emit('conventions_updated', { teamId, conventions, modifiedBy });
        console.log(`✅ Conventions updated for team ${teamId} by ${modifiedBy}`);
    }
    /**
     * Add team member
     */
    async addTeamMember(teamId, userId, role, invitedBy) {
        const context = await this.getTeamContext(teamId);
        if (!context) {
            throw new Error(`Team ${teamId} not found`);
        }
        // Check permissions
        const inviter = context.members.find(m => m.userId === invitedBy);
        if (!inviter || !inviter.permissions.canInviteMembers) {
            throw new Error(`User ${invitedBy} does not have permission to invite members`);
        }
        // Check if already a member
        if (context.members.some(m => m.userId === userId)) {
            throw new Error(`User ${userId} is already a member of team ${teamId}`);
        }
        const newMember = {
            userId,
            role,
            joinedAt: Date.now(),
            permissions: this.getRolePermissions(role)
        };
        context.members.push(newMember);
        context.profile.updatedAt = Date.now();
        const conventionsPath = join(this.teamsPath, teamId, 'conventions.json');
        await fs.writeFile(conventionsPath, JSON.stringify(context, null, 2));
        this.emit('member_added', { teamId, userId, role, invitedBy });
        console.log(`✅ User ${userId} added to team ${teamId} as ${role}`);
    }
    /**
     * Remove team member
     */
    async removeTeamMember(teamId, userId, removedBy) {
        const context = await this.getTeamContext(teamId);
        if (!context) {
            throw new Error(`Team ${teamId} not found`);
        }
        // Check permissions
        const remover = context.members.find(m => m.userId === removedBy);
        if (!remover || !remover.permissions.canRemoveMembers) {
            throw new Error(`User ${removedBy} does not have permission to remove members`);
        }
        // Cannot remove owner
        if (userId === context.profile.ownerId) {
            throw new Error('Cannot remove team owner');
        }
        context.members = context.members.filter(m => m.userId !== userId);
        context.profile.updatedAt = Date.now();
        const conventionsPath = join(this.teamsPath, teamId, 'conventions.json');
        await fs.writeFile(conventionsPath, JSON.stringify(context, null, 2));
        this.emit('member_removed', { teamId, userId, removedBy });
        console.log(`✅ User ${userId} removed from team ${teamId}`);
    }
    /**
     * Update member role
     */
    async updateMemberRole(teamId, userId, newRole, updatedBy) {
        const context = await this.getTeamContext(teamId);
        if (!context) {
            throw new Error(`Team ${teamId} not found`);
        }
        // Check permissions (only owner can change roles)
        if (updatedBy !== context.profile.ownerId) {
            throw new Error('Only team owner can change member roles');
        }
        // Cannot change owner role
        if (userId === context.profile.ownerId) {
            throw new Error('Cannot change owner role');
        }
        const member = context.members.find(m => m.userId === userId);
        if (!member) {
            throw new Error(`User ${userId} is not a member of team ${teamId}`);
        }
        member.role = newRole;
        member.permissions = this.getRolePermissions(newRole);
        context.profile.updatedAt = Date.now();
        const conventionsPath = join(this.teamsPath, teamId, 'conventions.json');
        await fs.writeFile(conventionsPath, JSON.stringify(context, null, 2));
        this.emit('member_role_updated', { teamId, userId, newRole, updatedBy });
        console.log(`✅ User ${userId} role updated to ${newRole} in team ${teamId}`);
    }
    /**
     * Check if team exists
     */
    async teamExists(teamId) {
        try {
            const conventionsPath = join(this.teamsPath, teamId, 'conventions.json');
            await fs.access(conventionsPath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Delete team
     */
    async deleteTeam(teamId, deletedBy) {
        const context = await this.getTeamContext(teamId);
        if (!context) {
            throw new Error(`Team ${teamId} not found`);
        }
        // Only owner can delete team
        if (deletedBy !== context.profile.ownerId) {
            throw new Error('Only team owner can delete team');
        }
        const teamDir = join(this.teamsPath, teamId);
        await fs.rm(teamDir, { recursive: true, force: true });
        this.emit('team_deleted', { teamId, deletedBy });
        console.log(`✅ Team deleted: ${teamId}`);
    }
    /**
     * List all teams
     */
    async listTeams() {
        try {
            const teams = [];
            const entries = await fs.readdir(this.teamsPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const context = await this.getTeamContext(entry.name);
                    if (context) {
                        teams.push(context.profile);
                    }
                }
            }
            return teams;
        }
        catch {
            return [];
        }
    }
    /**
     * Get teams for a user
     */
    async getUserTeams(userId) {
        const allTeams = [];
        const entries = await fs.readdir(this.teamsPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const context = await this.getTeamContext(entry.name);
                if (context && context.members.some(m => m.userId === userId)) {
                    allTeams.push(context);
                }
            }
        }
        return allTeams;
    }
    /**
     * Get role permissions
     */
    getRolePermissions(role) {
        switch (role) {
            case 'owner':
                return {
                    canApproveDeployments: true,
                    canModifyConventions: true,
                    canInviteMembers: true,
                    canRemoveMembers: true
                };
            case 'admin':
                return {
                    canApproveDeployments: true,
                    canModifyConventions: true,
                    canInviteMembers: true,
                    canRemoveMembers: true
                };
            case 'developer':
                return {
                    canApproveDeployments: false,
                    canModifyConventions: false,
                    canInviteMembers: false,
                    canRemoveMembers: false
                };
            case 'viewer':
                return {
                    canApproveDeployments: false,
                    canModifyConventions: false,
                    canInviteMembers: false,
                    canRemoveMembers: false
                };
        }
    }
    /**
     * Get default team conventions
     */
    getDefaultConventions() {
        return {
            // Code Style
            codeStyle: 'airbnb',
            formatter: 'prettier',
            linter: 'eslint',
            // Commit Conventions
            commitStyle: 'conventional',
            commitMessageFormat: 'type(scope): subject',
            requireIssueReference: false,
            // Branching Strategy
            branchingStrategy: {
                type: 'github-flow',
                mainBranch: 'main',
                featureBranchPrefix: 'feature/',
                releaseBranchPrefix: 'release/',
                hotfixBranchPrefix: 'hotfix/',
                requirePRForMain: true
            },
            // Review Policy
            reviewPolicy: {
                required: true,
                minApprovals: 1,
                autoApproveOwner: false,
                blockOnFailedTests: true,
                blockOnFailedLint: true
            },
            // Testing Policy
            testingPolicy: {
                required: true,
                minCoverage: 80,
                requiredTests: ['unit'],
                blockOnFailure: true,
                autoRunOnPR: true
            },
            // Documentation
            requireDocstrings: true,
            docStyle: 'jsdoc',
            // Deployment
            deploymentStrategy: 'manual'
        };
    }
}
// Export singleton instance
export const teamContextManager = new TeamContextManager();
//# sourceMappingURL=team-context-manager.js.map