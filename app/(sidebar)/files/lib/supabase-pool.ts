import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Connection pool for Supabase clients to reduce connection overhead
 * and improve performance by reusing connections
 */
class SupabasePool {
  private static instance: SupabasePool;
  private pool: SupabaseClient[] = [];
  private readonly maxPoolSize = 10;
  private readonly minPoolSize = 2;
  private activeConnections = 0;
  
  private constructor() {
    // Pre-warm the pool with minimum connections
    this.initializePool();
  }
  
  static getInstance(): SupabasePool {
    if (!this.instance) {
      this.instance = new SupabasePool();
    }
    return this.instance;
  }
  
  private async initializePool() {
    for (let i = 0; i < this.minPoolSize; i++) {
      const client = this.createConnection();
      this.pool.push(client);
    }
    console.log(`[Pool] Initialized with ${this.minPoolSize} connections`);
  }
  
  async getClient(): Promise<SupabaseClient> {
    // Try to get from pool first
    if (this.pool.length > 0) {
      const client = this.pool.pop()!;
      this.activeConnections++;
      console.log(`[Pool] Reusing connection. Pool size: ${this.pool.length}, Active: ${this.activeConnections}`);
      return client;
    }
    
    // Create new connection if under limit
    if (this.activeConnections < this.maxPoolSize) {
      this.activeConnections++;
      console.log(`[Pool] Creating new connection. Active: ${this.activeConnections}`);
      return this.createConnection();
    }
    
    // Wait for available connection if at limit
    console.log('[Pool] Max connections reached, waiting...');
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.pool.length > 0) {
          clearInterval(checkInterval);
          resolve(this.getClient());
        }
      }, 100);
    });
  }
  
  releaseClient(client: SupabaseClient) {
    this.activeConnections--;
    
    // Return to pool if under max size
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push(client);
      console.log(`[Pool] Connection released. Pool size: ${this.pool.length}, Active: ${this.activeConnections}`);
    } else {
      // Let excess connections be garbage collected
      console.log(`[Pool] Connection discarded (pool full). Active: ${this.activeConnections}`);
    }
  }
  
  private createConnection(): SupabaseClient {
    // IMPORTANT: Use service role key for background processing
    // This bypasses RLS for system operations
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: {
          schema: 'public',
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            'x-connection-pool': 'true',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          }
        }
      }
    );
    
    console.log('[Pool] Created connection with service role key');
    return client;
  }
  
  // Utility method to execute with automatic connection management
  async withConnection<T>(
    operation: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      return await operation(client);
    } finally {
      this.releaseClient(client);
    }
  }
  
  // Get pool statistics
  getStats() {
    return {
      poolSize: this.pool.length,
      activeConnections: this.activeConnections,
      totalCapacity: this.maxPoolSize
    };
  }
}

export const supabasePool = SupabasePool.getInstance();

// Helper function for easy usage
export async function withPooledClient<T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  return supabasePool.withConnection(operation);
}