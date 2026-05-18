import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactElement<LucideIcon>;
  color: 'blue' | 'green' | 'purple' | 'orange';
  change?: {
    value: number;
    isIncrease: boolean;
  };
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  color,
  change 
}) => {
  const colorStyles = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  const lightColorStyles = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:transform hover:scale-105 duration-300">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            
            {change && (
              <p className={`text-sm mt-2 ${change.isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                {change.isIncrease ? '+' : '-'}{Math.abs(change.value)}%
                <span className="text-gray-500 ml-1">from last month</span>
              </p>
            )}
          </div>
          
          <div className={`p-3 rounded-full ${lightColorStyles[color]}`}>
            {React.cloneElement(icon, { size: 24 })}
          </div>
        </div>
      </div>
      <div className={`h-1 ${colorStyles[color]}`}></div>
    </div>
  );
};