/**
 * API Endpoint: Connection Pool Management
 * 
 * GET /api/database/connection-pool - Get pool statistics and health
 * POST /api/database/connection-pool - Configure pool settings
 * DELETE /api/database/connection-pool - Reset pool statistics
 * 
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  getPoolStats, 
  checkPoolHealth, 
  resetPoolStats,
  configurePool
} from '@/lib/database/connection-pool';

/**
 * GET - Get connection pool statistics and health
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get pool health and statistics
    const health = checkPoolHealth();
    const stats = getPoolStats();

    return NextResponse.json({
      success: true,
      health: {
        healthy: health.healthy,
        issues: health.issues,
      },
      stats: {
        activeConnections: stats.activeConnections,
        idleConnections: stats.idleConnections,
        totalConnections: stats.totalConnections,
        requestsServed: stats.requestsServed,
        errors: stats.errors,
        errorRate: stats.requestsServed > 0 
          ? ((stats.errors / stats.requestsServed) * 100).toFixed(2) + '%'
          : '0%',
        avgResponseTime: stats.avgResponseTime.toFixed(0) + 'ms',
        utilization: stats.totalConnections > 0
          ? ((stats.activeConnections / stats.totalConnections) * 100).toFixed(0) + '%'
          : '0%',
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error getting pool stats:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get pool statistics',
        details: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Configure connection pool settings
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { poolSize, maxRetries, retryDelay, timeout, idleTimeout } = body;

    // Validate configuration
    const config: any = {};
    
    if (poolSize !== undefined) {
      if (typeof poolSize !== 'number' || poolSize < 1 || poolSize > 100) {
        return NextResponse.json(
          { success: false, error: 'poolSize must be between 1 and 100' },
          { status: 400 }
        );
      }
      config.poolSize = poolSize;
    }
    
    if (maxRetries !== undefined) {
      if (typeof maxRetries !== 'number' || maxRetries < 0 || maxRetries > 10) {
        return NextResponse.json(
          { success: false, error: 'maxRetries must be between 0 and 10' },
          { status: 400 }
        );
      }
      config.maxRetries = maxRetries;
    }
    
    if (retryDelay !== undefined) {
      if (typeof retryDelay !== 'number' || retryDelay < 100 || retryDelay > 10000) {
        return NextResponse.json(
          { success: false, error: 'retryDelay must be between 100 and 10000 ms' },
          { status: 400 }
        );
      }
      config.retryDelay = retryDelay;
    }
    
    if (timeout !== undefined) {
      if (typeof timeout !== 'number' || timeout < 1000 || timeout > 60000) {
        return NextResponse.json(
          { success: false, error: 'timeout must be between 1000 and 60000 ms' },
          { status: 400 }
        );
      }
      config.timeout = timeout;
    }
    
    if (idleTimeout !== undefined) {
      if (typeof idleTimeout !== 'number' || idleTimeout < 10000 || idleTimeout > 300000) {
        return NextResponse.json(
          { success: false, error: 'idleTimeout must be between 10000 and 300000 ms' },
          { status: 400 }
        );
      }
      config.idleTimeout = idleTimeout;
    }

    // Apply configuration
    configurePool(config);

    return NextResponse.json({
      success: true,
      message: 'Connection pool configured successfully',
      config,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error configuring pool:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to configure pool',
        details: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Reset connection pool statistics
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Reset statistics
    resetPoolStats();

    return NextResponse.json({
      success: true,
      message: 'Connection pool statistics reset successfully',
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error resetting pool stats:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset statistics',
        details: err.message,
      },
      { status: 500 }
    );
  }
}
