import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  ClipboardList, 
  Settings, 
  Bell,
  FileText,
  Calendar,
  Users,
  Building
} from 'lucide-react';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    { 
      icon: <UserPlus size={20} className="text-blue-600" />,
      label: 'Add Doctor',
      onClick: () => navigate('/doctors'),
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100'
    },
    { 
      icon: <Users size={20} className="text-green-600" />,
      label: 'Add Nurse',
      onClick: () => navigate('/nurses'),
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100'
    },
    { 
      icon: <ClipboardList size={20} className="text-purple-600" />,
      label: 'View Reports',
      onClick: () => navigate('/activity'),
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100'
    },
    { 
      icon: <Calendar size={20} className="text-orange-600" />,
      label: 'Schedule',
      onClick: () => {},
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100'
    },
    { 
      icon: <FileText size={20} className="text-teal-600" />,
      label: 'Documents',
      onClick: () => {},
      bgColor: 'bg-teal-50',
      hoverColor: 'hover:bg-teal-100'
    },
    { 
      icon: <Bell size={20} className="text-red-600" />,
      label: 'Notifications',
      onClick: () => {},
      bgColor: 'bg-red-50',
      hoverColor: 'hover:bg-red-100'
    },
    { 
      icon: <Building size={20} className="text-indigo-600" />,
      label: 'Departments',
      onClick: () => {},
      bgColor: 'bg-indigo-50',
      hoverColor: 'hover:bg-indigo-100'
    },
    { 
      icon: <Settings size={20} className="text-gray-600" />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
      bgColor: 'bg-gray-50',
      hoverColor: 'hover:bg-gray-100'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 p-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`${action.bgColor} ${action.hoverColor} rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-colors duration-200`}
          >
            {action.icon}
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};