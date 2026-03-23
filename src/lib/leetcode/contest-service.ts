export interface LeetCodeContest {
  title: string;
  url: string;
  startTime: string;
  endTime: string;
  duration: number;
  platform: string;
}

export interface LeetCodeContestResponse {
  ok: boolean;
  data: LeetCodeContest[];
  lastUpdated: string;
}

export interface ContestStatus {
  status: 'upcoming' | 'live' | 'ended';
  timeRemaining?: number;
  progress?: number;
}

export class LeetCodeContestService {
  // Use internal API route to avoid CORS issues in the browser
  private static readonly INTERNAL_API = '/api/leetcode/contests';
  private static readonly EXTERNAL_FALLBACK = 'https://contest-hive.vercel.app/api/leetcode';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static cache: { data: LeetCodeContestResponse | null; timestamp: number } = {
    data: null,
    timestamp: 0
  };

  /**
   * Fetch live contests from LeetCode via Contest Hive API
   */
  static async fetchLiveContests(): Promise<LeetCodeContest[]> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.cache.data && (now - this.cache.timestamp) < this.CACHE_DURATION) {
        return this.cache.data.data;
      }

      // Try internal API first to avoid CORS, then external fallback
      let response = await fetch(this.INTERNAL_API, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'codCampus/1.0'
        }
      });

      if (!response.ok) {
        response = await fetch(this.EXTERNAL_FALLBACK, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'codCampus/1.0'
          }
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LeetCodeContestResponse = await response.json();
      
      if (!data.ok) {
        throw new Error('API returned error status');
      }

      // Update cache
      this.cache = {
        data,
        timestamp: now
      };

      return data.data;
    } catch (error) {
      console.error('Error fetching LeetCode contests:', error);
      // Return cached data if available, otherwise empty array
      return this.cache.data?.data || [];
    }
  }

  /**
   * Get contest status and time information
   */
  static getContestStatus(contest: LeetCodeContest): ContestStatus {
    const now = new Date();
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);

    if (now < startTime) {
      const timeRemaining = startTime.getTime() - now.getTime();
      return {
        status: 'upcoming',
        timeRemaining: Math.max(0, timeRemaining)
      };
    } else if (now >= startTime && now <= endTime) {
      const totalDuration = endTime.getTime() - startTime.getTime();
      const elapsed = now.getTime() - startTime.getTime();
      const progress = Math.min(100, (elapsed / totalDuration) * 100);
      const timeRemaining = endTime.getTime() - now.getTime();
      
      return {
        status: 'live',
        timeRemaining: Math.max(0, timeRemaining),
        progress: Math.round(progress)
      };
    } else {
      return {
        status: 'ended'
      };
    }
  }

  /**
   * Format time remaining in a human-readable format
   */
  static formatTimeRemaining(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Format duration in a human-readable format
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Get contests by status
   */
  static async getContestsByStatus(status: 'upcoming' | 'live' | 'ended'): Promise<LeetCodeContest[]> {
    const contests = await this.fetchLiveContests();
    return contests.filter(contest => {
      const contestStatus = this.getContestStatus(contest);
      return contestStatus.status === status;
    });
  }

  /**
   * Get live contests only
   */
  static async getLiveContests(): Promise<LeetCodeContest[]> {
    return this.getContestsByStatus('live');
  }

  /**
   * Get upcoming contests only
   */
  static async getUpcomingContests(): Promise<LeetCodeContest[]> {
    return this.getContestsByStatus('upcoming');
  }

  /**
   * Get all contests with status information
   */
  static async getAllContestsWithStatus(): Promise<(LeetCodeContest & { status: ContestStatus })[]> {
    const contests = await this.fetchLiveContests();
    return contests.map(contest => ({
      ...contest,
      status: this.getContestStatus(contest)
    }));
  }
}
