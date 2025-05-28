import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserRound, 
  Stethoscope, 
  ClipboardList, 
  Settings,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/doctors', label: 'Doctors', icon: <Stethoscope size={20} /> },
  { path: '/nurses', label: 'Nurses', icon: <UserRound size={20} /> },
  { path: '/activity', label: 'Activity Log', icon: <ClipboardList size={20} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className="bg-gradient-to-b from-blue-800 to-blue-900 text-white min-h-screen w-64 p-4 flex flex-col transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-center mb-8 pt-2">
        <h1 className="text-xl font-bold">Hospital Admin</h1>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center p-3 rounded-lg transition-colors duration-150 ease-in-out ${
                  isActive(item.path)
                    ? 'bg-blue-700 text-white font-medium'
                    : 'text-blue-100 hover:bg-blue-700/50'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};