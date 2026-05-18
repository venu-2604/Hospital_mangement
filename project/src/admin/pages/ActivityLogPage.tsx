import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserPlus
} from 'lucide-react';
import { fetchDoctorSummaries, type DoctorSummaryResponse } from '../services/adminApi';

type ActivityEntry = {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  user: string;
};

export const ActivityLogPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorSummaryResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchDoctorSummaries();
        if (!cancelled) {
          setDoctors(list);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load activity');
          setDoctors([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activityLogs: ActivityEntry[] = useMemo(() => {
    const sorted = [...doctors].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    return sorted.map(d => ({
      id: d.doctorId,
      action: 'create',
      description: `Doctor record: ${d.name?.trim() || d.doctorId}${d.department ? ` — ${d.department}` : ''}`,
      timestamp: d.createdAt || new Date(0).toISOString(),
      user: 'Database'
    }));
  }, [doctors]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <UserPlus size={18} className="text-green-500" />;
      default:
        return <Users size={18} className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupedLogs: Record<string, ActivityEntry[]> = {};

  activityLogs.forEach(log => {
    const date = new Date(log.timestamp);
    const dateKey = date.toISOString().split('T')[0];

    if (!groupedLogs[dateKey]) {
      groupedLogs[dateKey] = [];
    }

    groupedLogs[dateKey].push(log);
  });

  const formatDateHeader = (dateKey: string) => {
    const date = new Date(dateKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Loading activity…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Activity Log</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Activity Log</h1>
        <p className="text-gray-600">
          Doctor records ordered by registration time from the database (derived view; full audit logging is not
          enabled).
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium text-gray-700">Recent activities</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {activityLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No doctor records to show.</div>
          ) : (
            Object.keys(groupedLogs)
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
              .map(dateKey => (
                <div key={dateKey} className="px-4 py-2">
                  <h3 className="text-sm font-medium text-gray-500 py-2">{formatDateHeader(dateKey)}</h3>

                  <div className="space-y-3">
                    {groupedLogs[dateKey].map(log => (
                      <div
                        key={log.id}
                        className="flex items-start p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="p-2 rounded-full bg-gray-100 mr-3">{getActionIcon(log.action)}</div>

                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{log.description}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-500">{formatDate(log.timestamp)}</span>
                            <span className="mx-1 text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{log.user}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};
