import React, { useState } from 'react';
import { User, UserStatus } from '../../types';
import { Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../ui/Button';

interface StaffListProps {
  staff: User[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const StaffList: React.FC<StaffListProps> = ({ staff, onEdit, onDelete }) => {
  const [filter, setFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter staff members based on search term and status
  const filteredStaff = staff.filter((member) => {
    const matchesSearch = 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(filter.toLowerCase()) ||
      member.email.toLowerCase().includes(filter.toLowerCase()) ||
      member.department?.toLowerCase().includes(filter.toLowerCase()) ||
      member.specialization?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return <CheckCircle size={18} className="text-green-500" />;
      case UserStatus.INACTIVE:
        return <XCircle size={18} className="text-red-500" />;
      case UserStatus.PENDING:
        return <Clock size={18} className="text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, department..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value={UserStatus.ACTIVE}>Active</option>
            <option value={UserStatus.INACTIVE}>Inactive</option>
            <option value={UserStatus.PENDING}>Pending</option>
          </select>
        </div>
      </div>

      {filteredStaff.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500">No staff members found matching your criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white shadow rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStaff.map((member) => (
                <tr 
                  key={member.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {member.imageUrl ? (
                        <img
                          src={member.imageUrl}
                          alt={`${member.firstName} ${member.lastName}`}
                          className="h-10 w-10 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white uppercase mr-3">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {member.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.department || '-'}
                    {member.specialization && (
                      <div className="text-xs text-gray-400">{member.specialization}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.joinDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(member.status)}
                      <span className={`ml-1.5 text-sm ${
                        member.status === UserStatus.ACTIVE 
                          ? 'text-green-600' 
                          : member.status === UserStatus.INACTIVE 
                            ? 'text-red-600' 
                            : 'text-yellow-600'
                      }`}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(member.id)}
                      className="mr-2"
                    >
                      <Edit size={16} className="mr-1" /> Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(member.id)}
                    >
                      <Trash2 size={16} className="mr-1" /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};