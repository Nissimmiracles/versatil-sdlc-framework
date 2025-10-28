/**
 * Chain-of-Verification (CoVe) Engine
 * Implements the CoVe methodology from Meta AI research (2023)
 *
 * Purpose: Reduce hallucinations through multi-step fact-checking
 *
 * Process:
 * 1. Draft initial response
 * 2. Plan verification questions
 * 3. Answer questions independently (no bias)
 * 4. Generate final verified response
 *
 * Reference: https://arxiv.org/abs/2309.11495
 */
export interface VerificationQuestion {
    question: string;
    method: 'file' | 'command' | 'content' | 'git' | 'api';
    expectedAnswer?: string;
}
export interface VerificationAnswer {
    question: string;
    answer: string;
    confidence: number;
    evidence: any;
    method: string;
}
export interface CoVeResult {
    claim: string;
    verified: boolean;
    confidence: number;
    questions: VerificationQuestion[];
    answers: VerificationAnswer[];
    crossCheckPassed: boolean;
    finalResponse: string;
}
export declare class ChainOfVerification {
    private workingDirectory;
    constructor(workingDirectory: string);
    /**
     * Execute Chain-of-Verification for a claim
     */
    verify(claim: string): Promise<CoVeResult>;
    /**
     * Step 1: Plan Verification Questions
     */
    private planVerificationQuestions;
    /**
     * Step 2: Answer Verification Questions Independently
     */
    private answerVerificationQuestion;
    /**
     * Step 3: Cross-Check Answers for Consistency
     */
    private crossCheckAnswers;
    /**
     * Step 4: Generate Final Verified Response
     */
    private generateFinalResponse;
}
