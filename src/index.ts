/**
 * VERSATIL SDLC Framework v1.2.1
 */

export class VERSATIL {
  private version = '1.2.1';
  
  constructor() {
    console.log('VERSATIL SDLC Framework initialized');
  }
  
  getVersion(): string {
    return this.version;
  }
}

export default VERSATIL;

// Export types
export * from './types';
