import React from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2, 
  LogIn,
  UserPlus 
} from 'lucide-react';

// Mock activity log data
const activityLogs = [
  { 
    id: 1, 
    action: 'login', 
    description: 'Admin logged in', 
    timestamp: '2025-07-10T09:30:00Z',
    user: 'Admin User'
  },
  { 
    id: 2, 
    action: 'create', 
    description: 'Added new doctor: Dr. Jessica Miller', 
    timestamp: '2025-07-10T10:15:00Z',
    user: 'Admin User'
  },
  { 
    id: 3, 
    action: 'update', 
    description: 'Updated nurse information: Emily Davis', 
    timestamp: '2025-07-10T11:20:00Z',
    user: 'Admin User'
  },
  { 
    id: 4, 
    action: 'status', 
    description: 'Changed status for Dr. John Smith to Active', 
    timestamp: '2025-07-09T14:05:00Z',
    user: 'Admin User'
  },
  { 
    id: 5, 
    action: 'delete', 
    description: 'Deleted nurse account: Michael Wilson', 
    timestamp: '2025-07-09T16:30:00Z',
    user: 'Admin User'
  },
  { 
    id: 6, 
    action: 'create', 
    description: 'Added new nurse: Robert Brown', 
    timestamp: '2025-07-08T09:45:00Z',
    user: 'Admin User'
  },
  { 
    id: 7, 
    action: 'status', 
    description: 'Changed status for Dr. Sarah Johnson to Inactive', 
    timestamp: '2025-07-08T13:20:00Z',
    user: 'Admin User'
  },
  { 
    id: 8, 
    action: 'login', 
    description: 'Admin logged in', 
    timestamp: '2025-07-08T08:30:00Z',
    user: 'Admin User'
  },
  { 
    id: 9, 
    action: 'update', 
    description: 'Updated doctor specialization: Dr. Thompson', 
    timestamp: '2025-07-07T11:10:00Z',
    user: 'Admin User'
  },
  { 
    id: 10, 
    action: 'create', 
    description: 'Added new doctor: Dr. William Clark', 
    timestamp: '2025-07-07T10:05:00Z',
    user: 'Admin User'
  }
];

export const ActivityLogPage: React.FC = () => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <LogIn size={18} className="text-blue-500" />;
      case 'create':
        return <UserPlus size={18} className="text-green-500" />;
      case 'update':
        return <Edit size={18} className="text-orange-500" />;
      case 'status':
        return <CheckCircle size={18} className="text-purple-500" />;
      case 'delete':
        return <Trash2 size={18} className="text-red-500" />;
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

  // Group logs by date
  const groupedLogs: Record<string, typeof activityLogs> = {};
  
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
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Activity Log</h1>
        <p className="text-gray-600">Track all administrative actions in the system</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex flex-wrap items-center justify-between">
            <h2 className="text-lg font-medium text-gray-700">Recent Activities</h2>
            
            <div className="flex items-center mt-2 md:mt-0">
              <select className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Activities</option>
                <option value="login">Logins</option>
                <option value="create">Creations</option>
                <option value="update">Updates</option>
                <option value="status">Status Changes</option>
                <option value="delete">Deletions</option>
              </select>
              
              <input
                type="date"
                className="ml-2 border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {Object.keys(groupedLogs)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map(dateKey => (
              <div key={dateKey} className="px-4 py-2">
                <h3 className="text-sm font-medium text-gray-500 py-2">
                  {formatDateHeader(dateKey)}
                </h3>
                
                <div className="space-y-3">
                  {groupedLogs[dateKey].map(log => (
                    <div key={log.id} className="flex items-start p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="p-2 rounded-full bg-gray-100 mr-3">
                        {getActionIcon(log.action)}
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{log.description}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-500">
                            {formatDate(log.timestamp)}
                          </span>
                          <span className="mx-1 text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            By {log.user}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
        
        <div className="p-4 border-t text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Load More Activities
          </button>
        </div>
      </div>
    </div>
  );
};