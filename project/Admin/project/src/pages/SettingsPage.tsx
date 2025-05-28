import React, { useState } from 'react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Save, Bell, Shield, Globe, Mail } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  const tabs = [
    { id: 'general', label: 'General', icon: <Globe size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'email', label: 'Email', icon: <Mail size={18} /> }
  ];
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600">Configure system settings and preferences</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-6">
          {activeTab === 'general' && (
            <div>
              <h2 className="text-lg font-medium text-gray-700 mb-4">General Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Hospital Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      id="hospitalName"
                      label="Hospital Name"
                      value="General Hospital"
                      onChange={() => {}}
                    />
                    <Input
                      id="adminEmail"
                      label="Admin Email"
                      type="email"
                      value="admin@hospital.com"
                      onChange={() => {}}
                    />
                    <Input
                      id="phoneNumber"
                      label="Contact Number"
                      value="(555) 123-4567"
                      onChange={() => {}}
                    />
                    <Input
                      id="address"
                      label="Address"
                      value="123 Medical Drive, Health City"
                      onChange={() => {}}
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">System Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      id="language"
                      label="Language"
                      options={[
                        { value: 'en', label: 'English' },
                        { value: 'es', label: 'Spanish' },
                        { value: 'fr', label: 'French' }
                      ]}
                      value="en"
                      onChange={() => {}}
                    />
                    <Select
                      id="timezone"
                      label="Timezone"
                      options={[
                        { value: 'UTC-8', label: 'Pacific Time (PT)' },
                        { value: 'UTC-5', label: 'Eastern Time (ET)' },
                        { value: 'UTC+0', label: 'Greenwich Mean Time (GMT)' },
                        { value: 'UTC+1', label: 'Central European Time (CET)' }
                      ]}
                      value="UTC-5"
                      onChange={() => {}}
                    />
                    <Select
                      id="dateFormat"
                      label="Date Format"
                      options={[
                        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
                      ]}
                      value="MM/DD/YYYY"
                      onChange={() => {}}
                    />
                    <Select
                      id="timeFormat"
                      label="Time Format"
                      options={[
                        { value: '12h', label: '12 Hour (AM/PM)' },
                        { value: '24h', label: '24 Hour' }
                      ]}
                      value="12h"
                      onChange={() => {}}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button variant="outline" className="mr-2">
                  Reset
                </Button>
                <Button variant="primary">
                  <Save size={16} className="mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-medium text-gray-700 mb-4">Security Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Change Password</h3>
                  <div className="space-y-4">
                    <Input
                      id="currentPassword"
                      label="Current Password"
                      type="password"
                      value=""
                      onChange={() => {}}
                    />
                    <Input
                      id="newPassword"
                      label="New Password"
                      type="password"
                      value=""
                      onChange={() => {}}
                    />
                    <Input
                      id="confirmPassword"
                      label="Confirm New Password"
                      type="password"
                      value=""
                      onChange={() => {}}
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Two-Factor Authentication</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">Enable Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          id="toggle" 
                          className="sr-only"
                        />
                        <label 
                          htmlFor="toggle" 
                          className="block h-6 rounded-full bg-gray-300 cursor-pointer transition-colors duration-200 ease-in"
                          style={{ width: '3rem' }}
                        >
                          <span 
                            className="block h-6 w-6 bg-white rounded-full shadow transform transition-transform duration-200 ease-in" 
                            style={{ transform: 'translateX(0)' }}
                          ></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Session Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="autoLogout"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="autoLogout" className="ml-2 block text-sm text-gray-700">
                        Automatically log out after inactivity
                      </label>
                    </div>
                    <Select
                      id="logoutTime"
                      label="Inactivity Time"
                      options={[
                        { value: '5', label: '5 minutes' },
                        { value: '10', label: '10 minutes' },
                        { value: '15', label: '15 minutes' },
                        { value: '30', label: '30 minutes' },
                        { value: '60', label: '1 hour' }
                      ]}
                      value="30"
                      onChange={() => {}}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button variant="outline" className="mr-2">
                  Cancel
                </Button>
                <Button variant="primary">
                  <Save size={16} className="mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-lg font-medium text-gray-700 mb-4">Notification Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Email Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">New Staff Registration</p>
                        <p className="text-xs text-gray-500">
                          Receive emails when a new doctor or nurse is registered
                        </p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          id="emailNewStaff" 
                          checked
                          className="sr-only"
                        />
                        <label 
                          htmlFor="emailNewStaff" 
                          className="block h-6 rounded-full bg-blue-500 cursor-pointer transition-colors duration-200 ease-in"
                          style={{ width: '3rem' }}
                        >
                          <span 
                            className="block h-6 w-6 bg-white rounded-full shadow transform transition-transform duration-200 ease-in" 
                            style={{ transform: 'translateX(1.5rem)' }}
                          ></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Staff Updates</p>
                        <p className="text-xs text-gray-500">
                          Receive emails when staff information is updated
                        </p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          id="emailStaffUpdates" 
                          className="sr-only"
                        />
                        <label 
                          htmlFor="emailStaffUpdates" 
                          className="block h-6 rounded-full bg-gray-300 cursor-pointer transition-colors duration-200 ease-in"
                          style={{ width: '3rem' }}
                        >
                          <span 
                            className="block h-6 w-6 bg-white rounded-full shadow transform transition-transform duration-200 ease-in" 
                            style={{ transform: 'translateX(0)' }}
                          ></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Security Alerts</p>
                        <p className="text-xs text-gray-500">
                          Receive emails about security events and login attempts
                        </p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          id="emailSecurity" 
                          checked
                          className="sr-only"
                        />
                        <label 
                          htmlFor="emailSecurity" 
                          className="block h-6 rounded-full bg-blue-500 cursor-pointer transition-colors duration-200 ease-in"
                          style={{ width: '3rem' }}
                        >
                          <span 
                            className="block h-6 w-6 bg-white rounded-full shadow transform transition-transform duration-200 ease-in" 
                            style={{ transform: 'translateX(1.5rem)' }}
                          ></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">System Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Browser Notifications</p>
                        <p className="text-xs text-gray-500">
                          Show notifications in your browser
                        </p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          id="browserNotifications" 
                          checked
                          className="sr-only"
                        />
                        <label 
                          htmlFor="browserNotifications" 
                          className="block h-6 rounded-full bg-blue-500 cursor-pointer transition-colors duration-200 ease-in"
                          style={{ width: '3rem' }}
                        >
                          <span 
                            className="block h-6 w-6 bg-white rounded-full shadow transform transition-transform duration-200 ease-in" 
                            style={{ transform: 'translateX(1.5rem)' }}
                          ></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">New Staff Approval Notifications</p>
                        <p className="text-xs text-gray-500">
                          Get notified when a new staff member needs approval
                        </p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          id="approvalNotifications" 
                          checked
                          className="sr-only"
                        />
                        <label 
                          htmlFor="approvalNotifications" 
                          className="block h-6 rounded-full bg-blue-500 cursor-pointer transition-colors duration-200 ease-in"
                          style={{ width: '3rem' }}
                        >
                          <span 
                            className="block h-6 w-6 bg-white rounded-full shadow transform transition-transform duration-200 ease-in" 
                            style={{ transform: 'translateX(1.5rem)' }}
                          ></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button variant="outline" className="mr-2">
                  Reset to Default
                </Button>
                <Button variant="primary">
                  <Save size={16} className="mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
          
          {activeTab === 'email' && (
            <div>
              <h2 className="text-lg font-medium text-gray-700 mb-4">Email Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">SMTP Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      id="smtpServer"
                      label="SMTP Server"
                      value="smtp.hospital.com"
                      onChange={() => {}}
                    />
                    <Input
                      id="smtpPort"
                      label="SMTP Port"
                      value="587"
                      onChange={() => {}}
                    />
                    <Input
                      id="smtpUsername"
                      label="Username"
                      value="notifications@hospital.com"
                      onChange={() => {}}
                    />
                    <Input
                      id="smtpPassword"
                      label="Password"
                      type="password"
                      value="**********"
                      onChange={() => {}}
                    />
                    <div className="md:col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="useTLS"
                          checked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="useTLS" className="ml-2 block text-sm text-gray-700">
                          Use TLS/SSL
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Email Templates</h3>
                  <div className="space-y-4">
                    <Select
                      id="emailTemplate"
                      label="Select Template to Edit"
                      options={[
                        { value: 'welcome', label: 'Welcome Email' },
                        { value: 'credentials', label: 'New Credentials' },
                        { value: 'resetPassword', label: 'Password Reset' },
                        { value: 'accountUpdate', label: 'Account Update' }
                      ]}
                      value="welcome"
                      onChange={() => {}}
                    />
                    
                    <div>
                      <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700 mb-1">
                        Subject Line
                      </label>
                      <input
                        id="emailSubject"
                        type="text"
                        value="Welcome to General Hospital Staff Portal"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="emailBody" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Body
                      </label>
                      <textarea
                        id="emailBody"
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={`Dear {name},\n\nWelcome to the General Hospital Staff Portal! We're excited to have you join our team.\n\nYour account has been created with the following credentials:\nUsername: {email}\nTemporary Password: {password}\n\nPlease log in and change your password immediately.\n\nBest regards,\nGeneral Hospital Administration`}
                      ></textarea>
                    </div>
                    
                    <div className="flex flex-wrap items-center text-sm text-gray-600">
                      <p className="w-full mb-1">Available variables:</p>
                      <span className="bg-gray-100 px-2 py-1 rounded mr-2 mb-2">{'{name}'}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded mr-2 mb-2">{'{email}'}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded mr-2 mb-2">{'{role}'}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded mr-2 mb-2">{'{department}'}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded mr-2 mb-2">{'{password}'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button variant="outline" className="mr-2">
                  Test Email
                </Button>
                <Button variant="primary">
                  <Save size={16} className="mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};