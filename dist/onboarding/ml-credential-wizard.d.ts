/**
 * VERSATIL SDLC Framework - ML Workflow Multi-Cloud Credential Wizard
 * Interactive CLI wizard for setting up ML workflow credentials on GCP, AWS, or Supabase
 */
/**
 * Detect existing cloud provider from environment
 */
declare function detectCloudProvider(): 'gcp' | 'aws' | 'supabase' | null;
/**
 * Main wizard flow
 */
declare function runWizard(): Promise<void>;
export { runWizard, detectCloudProvider };
