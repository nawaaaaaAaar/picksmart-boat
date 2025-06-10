'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: any;
}

interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: HealthCheck[];
}

interface WebhookEvent {
  id: string;
  type: string;
  topic: string;
  status: 'success' | 'failed' | 'retry';
  attempts: number;
  lastAttempt: string;
  error?: string;
  processingTime?: number;
}

interface WebhookStats {
  recentEvents: number;
  successRate: number;
  averageProcessingTime: number;
  topicStats: Record<string, { total: number; success: number; failures: number }>;
}

export default function MonitoringDashboard() {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [webhookStats, setWebhookStats] = useState<WebhookStats | null>(null);
  const [recentWebhooks, setRecentWebhooks] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      // Fetch health data
      const healthResponse = await fetch('/api/monitoring/health');
      const healthResult = await healthResponse.json();
      setHealthData(healthResult);

      // Fetch webhook stats
      const statsResponse = await fetch('/api/monitoring/webhooks?action=stats');
      const statsResult = await statsResponse.json();
      if (statsResult.success) {
        setWebhookStats(statsResult.data);
      }

      // Fetch recent webhooks
      const recentResponse = await fetch('/api/monitoring/webhooks?action=recent&limit=20');
      const recentResult = await recentResponse.json();
      if (recentResult.success) {
        setRecentWebhooks(recentResult.data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return '✅';
      case 'degraded':
        return '⚠️';
      case 'unhealthy':
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <h1 className="text-3xl font-bold mb-6 bg-gray-200 h-8 w-64 rounded"></h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-200 h-48 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Overall System Health */}
      {healthData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(healthData.overall)}
              System Health: {healthData.overall.toUpperCase()}
            </CardTitle>
            <CardDescription>
              Uptime: {Math.floor(healthData.uptime / 3600)}h {Math.floor((healthData.uptime % 3600) / 60)}m
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {healthData.checks.map((check) => (
                <div
                  key={check.service}
                  className={`p-3 rounded-lg ${getStatusColor(check.status)}`}
                >
                  <div className="font-medium capitalize">
                    {check.service.replace('_', ' ')}
                  </div>
                  <div className="text-sm">
                    {check.status} {check.responseTime && `(${check.responseTime}ms)`}
                  </div>
                  {check.error && (
                    <div className="text-xs mt-1 opacity-75">
                      {check.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook Statistics */}
      {webhookStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-2xl font-bold">{webhookStats.recentEvents}</span>
                  <span className="text-gray-500 ml-2">Recent Events</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-green-600">
                    {webhookStats.successRate.toFixed(1)}%
                  </span>
                  <span className="text-gray-500 ml-2">Success Rate</span>
                </div>
                <div>
                  <span className="text-2xl font-bold">
                    {webhookStats.averageProcessingTime.toFixed(0)}ms
                  </span>
                  <span className="text-gray-500 ml-2">Avg Processing Time</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(webhookStats.topicStats).map(([topic, stats]) => (
                  <div key={topic} className="flex justify-between text-sm">
                    <span className="truncate">{topic}</span>
                    <span className="text-gray-500">
                      {stats.success}/{stats.total}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button
                  onClick={fetchData}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Refresh Data
                </button>
                <button
                  onClick={() => window.open('/api/monitoring/health', '_blank')}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  View Health JSON
                </button>
                <button
                  onClick={() => window.open('/api/monitoring/webhooks', '_blank')}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  View Webhook JSON
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Webhook Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Webhook Events</CardTitle>
          <CardDescription>Last 20 webhook events received</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Topic</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Processing Time</th>
                  <th className="text-left p-2">Attempts</th>
                  <th className="text-left p-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {recentWebhooks.map((webhook) => (
                  <tr key={webhook.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      {new Date(webhook.lastAttempt).toLocaleTimeString()}
                    </td>
                    <td className="p-2 font-mono text-xs">{webhook.topic}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(webhook.status)}`}>
                        {webhook.status}
                      </span>
                    </td>
                    <td className="p-2">
                      {webhook.processingTime ? `${webhook.processingTime}ms` : '-'}
                    </td>
                    <td className="p-2">{webhook.attempts}</td>
                    <td className="p-2 text-red-600 text-xs max-w-xs truncate">
                      {webhook.error || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 