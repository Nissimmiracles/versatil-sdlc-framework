/**
 * Agent Handoff Contract System
 *
 * Ensures reliable agent-to-agent communication with validation,
 * memory snapshots, and state verification.
 *
 * Use Cases:
 * - Three-tier handoffs: Alex-BA → (Dana + Marcus + James)
 * - Sequential handoffs: Marcus → Maria-QA
 * - Complex workflows: Sarah-PM orchestrating multi-agent tasks
 *
 * Philosophy: "Make implicit expectations explicit through contracts"
 */
/**
 * Contract version for backward compatibility
 */
export const CONTRACT_VERSION = '1.0.0';
/**
 * Contract builder for easier contract creation
 */
export class ContractBuilder {
    constructor(sender) {
        this.contract = {
            contractId: this.generateId(),
            version: CONTRACT_VERSION,
            createdAt: new Date(),
            sender: { agentId: sender },
            receivers: [],
            workItems: [],
            type: 'sequential',
            priority: 'normal',
            status: 'pending',
            expectedOutput: {
                artifacts: [],
                successCriteria: []
            },
            memorySnapshot: {
                agentId: sender,
                timestamp: new Date(),
                memoryFiles: {},
                criticalPatterns: [],
                contextSummary: '',
                estimatedTokens: 0
            }
        };
    }
    /**
     * Add a receiver to the contract
     */
    addReceiver(agentId, role) {
        this.contract.receivers.push({ agentId, role });
        return this;
    }
    /**
     * Set handoff type
     */
    setType(type) {
        this.contract.type = type;
        return this;
    }
    /**
     * Set priority
     */
    setPriority(priority) {
        this.contract.priority = priority;
        return this;
    }
    /**
     * Add work item
     */
    addWorkItem(workItem) {
        this.contract.workItems.push(workItem);
        return this;
    }
    /**
     * Set expected output
     */
    setExpectedOutput(output) {
        this.contract.expectedOutput = output;
        return this;
    }
    /**
     * Add memory snapshot
     */
    setMemorySnapshot(snapshot) {
        this.contract.memorySnapshot = snapshot;
        return this;
    }
    /**
     * Set context
     */
    setContext(context) {
        this.contract.context = context;
        return this;
    }
    /**
     * Set expiration time
     */
    setExpiration(hours) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + hours);
        this.contract.expiresAt = expiresAt;
        return this;
    }
    /**
     * Build the final contract
     */
    build() {
        if (!this.contract.receivers || this.contract.receivers.length === 0) {
            throw new Error('Contract must have at least one receiver');
        }
        if (!this.contract.workItems || this.contract.workItems.length === 0) {
            throw new Error('Contract must have at least one work item');
        }
        return this.contract;
    }
    /**
     * Generate unique contract ID
     */
    generateId() {
        return `contract-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
}
//# sourceMappingURL=agent-handoff-contract.js.map