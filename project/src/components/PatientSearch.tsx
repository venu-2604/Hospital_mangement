import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface PatientSearchProps {
  onSearch: (query: string) => void;
}

export function PatientSearch({ onSearch }: PatientSearchProps) {
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search patients..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    </div>
  );
}