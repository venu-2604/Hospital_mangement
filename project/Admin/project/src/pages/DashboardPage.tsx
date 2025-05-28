import React from 'react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { useStaff } from '../context/StaffContext';
import { UserRole, UserStatus } from '../types';
import { 
  Stethoscope, 
  UserRound, 
  UserCheck, 
  Clock,
  Users
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { staff, getDoctors, getNurses } = useStaff();
  
  const doctors = getDoctors();
  const nurses = getNurses();
  
  const totalDoctors = doctors.length;
  const totalNurses = nurses.length;
  const activeStaff = staff.filter(member => member.status === UserStatus.ACTIVE).length;
  const pendingApprovals = staff.filter(member => member.status === UserStatus.PENDING).length;
  
  // Calculate activity rate (mock data for demonstration)
  const activeDoctors = doctors.filter(doc => doc.status === UserStatus.ACTIVE).length;
  const activeNurses = nurses.filter(nurse => nurse.status === UserStatus.ACTIVE).length;
  
  const doctorActiveRate = totalDoctors > 0 ? (activeDoctors / totalDoctors) * 100 : 0;
  const nurseActiveRate = totalNurses > 0 ? (activeNurses / totalNurses) * 100 : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome to your hospital management dashboard</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Doctors"
          value={totalDoctors}
          icon={<Stethoscope />}
          color="blue"
          change={{ value: 5, isIncrease: true }}
        />
        <StatsCard
          title="Total Nurses"
          value={totalNurses}
          icon={<UserRound />}
          color="green"
          change={{ value: 3, isIncrease: true }}
        />
        <StatsCard
          title="Active Staff"
          value={activeStaff}
          icon={<UserCheck />}
          color="purple"
          change={{ value: 8, isIncrease: true }}
        />
        <StatsCard
          title="Pending Approvals"
          value={pendingApprovals}
          icon={<Clock />}
          color="orange"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Staff Overview</h2>
        </div>
        
        <div className="flex items-center mb-6">
          <div className="w-1/2 pr-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <Stethoscope size={16} className="text-blue-500 mr-2" />
                <span className="text-gray-600">Doctors</span>
              </div>
              <span className="font-semibold">{totalDoctors}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${doctorActiveRate}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Active: {activeDoctors}</span>
              <span className="text-gray-500">{doctorActiveRate.toFixed(0)}%</span>
            </div>
          </div>
          
          <div className="w-1/2 pl-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <UserRound size={16} className="text-green-500 mr-2" />
                <span className="text-gray-600">Nurses</span>
              </div>
              <span className="font-semibold">{totalNurses}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${nurseActiveRate}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Active: {activeNurses}</span>
              <span className="text-gray-500">{nurseActiveRate.toFixed(0)}%</span>
            </div>
          </div>
        </div>
        
        <h3 className="text-sm font-medium text-gray-600 mb-2">Department Distribution</h3>
        <div className="space-y-2">
          {['Cardiology', 'Neurology', 'Pediatrics', 'Emergency'].map((dept) => {
            const deptStaff = staff.filter(m => m.department === dept).length;
            const percentage = staff.length > 0 ? (deptStaff / staff.length) * 100 : 0;
            
            return (
              <div key={dept}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{dept}</span>
                  <span className="text-sm font-medium">{deptStaff}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};