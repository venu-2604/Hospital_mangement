import React, { useMemo } from 'react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { useStaff } from '../context/StaffContext';
import { UserStatus } from '../types';
import {
  Stethoscope,
  UserRound,
  UserCheck,
  Clock
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { staff, getDoctors, getNurses, loading, error } = useStaff();

  const doctors = getDoctors();
  const nurses = getNurses();

  const totalDoctors = doctors.length;
  const totalNurses = nurses.length;
  const activeStaff = staff.filter(member => member.status === UserStatus.ACTIVE).length;
  const pendingApprovals = staff.filter(member => member.status === UserStatus.PENDING).length;

  const activeDoctors = doctors.filter(doc => doc.status === UserStatus.ACTIVE).length;
  const activeNurses = nurses.filter(nurse => nurse.status === UserStatus.ACTIVE).length;

  const doctorActiveRate = totalDoctors > 0 ? (activeDoctors / totalDoctors) * 100 : 0;
  const nurseActiveRate = totalNurses > 0 ? (activeNurses / totalNurses) * 100 : 0;

  const departmentKeys = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach(d => {
      const dept = (d.department || '').trim();
      set.add(dept ? dept : 'Unassigned');
    });
    const list = Array.from(set);
    list.sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    });
    return list;
  }, [doctors]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

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
        />
        <StatsCard
          title="Total Nurses"
          value={totalNurses}
          icon={<UserRound />}
          color="green"
        />
        <StatsCard
          title="Active Staff"
          value={activeStaff}
          icon={<UserCheck />}
          color="purple"
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

        <h3 className="text-sm font-medium text-gray-600 mb-2">Department distribution (doctors)</h3>
        {departmentKeys.length === 0 ? (
          <p className="text-sm text-gray-500">No doctor records with department data.</p>
        ) : (
          <div className="space-y-2">
            {departmentKeys.map(dept => {
              const deptDoctors = doctors.filter(m => {
                const d = (m.department || '').trim();
                const key = d ? d : 'Unassigned';
                return key === dept;
              }).length;
              const percentage =
                totalDoctors > 0 ? (deptDoctors / totalDoctors) * 100 : 0;

              return (
                <div key={dept}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">{dept}</span>
                    <span className="text-sm font-medium">{deptDoctors}</span>
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
        )}
      </div>
    </div>
  );
};
