import React, { useState, useEffect } from 'react';
import { Bell, Settings, LogOut, UserPlus, X, User, AlarmClock } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { registerPatient, updateDoctorStatus } from '../services/api';
import type { DoctorAuth } from '../types';

interface NavbarProps {
  onPatientUpdated?: () => void;
  onLogout?: () => void;
  doctorInfo?: DoctorAuth | null;
}

export function Navbar({ onPatientUpdated, onLogout, doctorInfo }: NavbarProps) {
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications] = useState([
    { id: 1, message: "New test results available for John Smith", time: "5m ago" },
    { id: 2, message: "Appointment reminder: Emma Johnson at 2:30 PM", time: "10m ago" },
    { id: 3, message: "Lab results updated for Sarah Williams", time: "30m ago" }
  ]);
  const [patientForm, setPatientForm] = useState({
    surname: '',
    name: '',
    fatherName: '',
    aadharNumber: '',
    age: '',
    bloodGroup: '',
    gender: 'Male',
    phoneNumber: '',
    address: '',
    bp: '',
    weight: '',
    temperature: '',
    symptoms: '',
    complaint: '',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem('doctor_reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [reminderTime, setReminderTime] = useState('');
  const [reminderNote, setReminderNote] = useState('');
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  const [activeReminder, setActiveReminder] = useState(null);

  // Save reminders to localStorage
  useEffect(() => {
    localStorage.setItem('doctor_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Check reminders every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      reminders.forEach(rem => {
        const remTime = new Date(rem.time);
        if (
          !rem.triggered &&
          remTime.getFullYear() === now.getFullYear() &&
          remTime.getMonth() === now.getMonth() &&
          remTime.getDate() === now.getDate() &&
          remTime.getHours() === now.getHours() &&
          remTime.getMinutes() === now.getMinutes() &&
          now.getSeconds() === 0
        ) {
          setActiveReminder(rem);
          setShowReminderPopup(true);
          playReminderSound();
          setReminders(rs => rs.map(r => r.id === rem.id ? { ...r, triggered: true } : r));
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [reminders]);

  // Play default sound
  function playReminderSound() {
    const audio = new window.Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play();
  }

  // Add reminder
  function addReminder(e) {
    e.preventDefault();
    if (!reminderTime || !reminderNote) return;
    setReminders([
      ...reminders,
      {
        id: Date.now(),
        time: reminderTime,
        note: reminderNote,
        triggered: false
      }
    ]);
    setReminderTime('');
    setReminderNote('');
  }

  // Remove reminder
  function removeReminder(id) {
    setReminders(reminders.filter(r => r.id !== id));
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setPatientForm({
      ...patientForm,
      [id]: value
    });
  };

  const handleLogout = async () => {
    if (doctorInfo?.doctorId) {
      await updateDoctorStatus(doctorInfo.doctorId, 'INActive');
    }
    if (onLogout) onLogout();
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!patientForm.name || !patientForm.surname || !patientForm.aadharNumber) {
        setError('Name, surname, and Aadhar number are required');
        setLoading(false);
        return;
      }

      // Validate Aadhar number format (12 digits)
      if (!/^\d{12}$/.test(patientForm.aadharNumber)) {
        setError('Aadhar number must be exactly 12 digits');
        setLoading(false);
        return;
      }

      // Validate phone number if provided
      if (patientForm.phoneNumber && !/^\d{10}$/.test(patientForm.phoneNumber)) {
        setError('Phone number must be exactly 10 digits');
        setLoading(false);
        return;
      }

      console.log('Submitting patient form:', patientForm);

      // Submit the form
      const response = await registerPatient(patientForm);
      
      // Set success message based on whether patient is new or existing
      if (response.isNewPatient) {
        setSuccess(`New patient registered successfully with ID: ${response.patient.patientId}`);
      } else {
        setSuccess(`Added new visit for existing patient: ${response.patient.name} (ID: ${response.patient.patientId})`);
      }
      
      // Notify the app that patient data has been updated
      if (onPatientUpdated) {
        onPatientUpdated();
      }
      
      // Reset form
      setPatientForm({
        surname: '',
        name: '',
        fatherName: '',
        aadharNumber: '',
        age: '',
        bloodGroup: '',
        gender: 'Male',
        phoneNumber: '',
        address: '',
        bp: '',
        weight: '',
        temperature: '',
        symptoms: '',
        complaint: '',
        status: 'Active'
      });
      
      // Close modal after a delay
      setTimeout(() => {
        setShowAddPatient(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error registering patient:', err);
      
      // Handle specific error cases
      const errorMsg = err.message || 'Failed to register patient. Please try again.';
      
      // Handle duplicate Aadhar number with different name error (with a better user message)
      if (errorMsg.includes('already exists with a different name')) {
        setError('This Aadhar number is already registered with a different patient name. Please verify the information and try again.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">AROGITH</span>
            <span className="text-sm text-gray-500">Doctor Dashboard</span>
          </div>

          {/* Doctor Quick Info */}
          <div className="flex items-center gap-6">
            {/* Add Patient Button */}
            <Dialog.Root open={showAddPatient} onOpenChange={setShowAddPatient}>
              <Dialog.Trigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  <UserPlus className="w-4 h-4" />
                  Add Patient
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Dialog.Title className="text-lg font-semibold">Add New Patient</Dialog.Title>
                      <Dialog.Close className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                      </Dialog.Close>
                    </div>

                    {error && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {success}
                      </div>
                    )}

                    <form onSubmit={handleAddPatient}>
                      {/* Personal Information */}
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-1">Surname</label>
                            <input 
                              id="surname"
                              type="text" 
                              placeholder="Enter surname"
                              value={patientForm.surname}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input 
                              id="name"
                              type="text" 
                              placeholder="Enter name"
                              value={patientForm.name}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                              required
                            />
                          </div>
                        <div>
                            <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                            <input 
                              id="fatherName"
                              type="text" 
                              placeholder="Enter father's name"
                              value={patientForm.fatherName}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Identification */}
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Identification</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                            <input 
                              id="aadharNumber"
                              type="text" 
                              placeholder="Enter 12-digit Aadhar number"
                              maxLength={12}
                              value={patientForm.aadharNumber}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                            <input 
                              id="age"
                              type="number" 
                              placeholder="Enter age"
                              min="0"
                              max="150"
                              value={patientForm.age}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            />
                        </div>
                        <div>
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select 
                              id="gender"
                              value={patientForm.gender}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Medical Information */}
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Medical Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                            <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                            <select 
                              id="bloodGroup"
                              value={patientForm.bloodGroup}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select blood group</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                        </select>
                      </div>
                      <div>
                            <label htmlFor="bp" className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
                            <input 
                              id="bp"
                              type="text" 
                              placeholder="e.g., 120/80"
                              value={patientForm.bp}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            />
                          </div>
                          <div>
                            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                            <input 
                              id="temperature"
                              type="text" 
                              placeholder="e.g., 98.6°F"
                              value={patientForm.temperature}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            />
                          </div>
                          <div>
                            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                            <input 
                              id="weight"
                              type="text" 
                              placeholder="Enter weight in kg"
                              value={patientForm.weight}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            />
                          </div>
                          <div>
                            <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                            <textarea
                              id="symptoms"
                              name="symptoms"
                              rows={3}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              value={patientForm.symptoms}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select 
                              id="status"
                              value={patientForm.status}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="Active">Active</option>
                              <option value="Critical">Critical</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h3>
                        <div className="grid grid-cols-1 gap-4">
                      <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input 
                              id="phoneNumber"
                              type="tel" 
                              placeholder="Enter phone number"
                              value={patientForm.phoneNumber}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Complaint */}
                      <div className="mb-4">
                        <label htmlFor="complaint" className="block text-sm font-medium text-gray-700 mb-1">Complaint</label>
                        <textarea 
                          id="complaint"
                          placeholder="Enter patient's complaint"
                          rows={3}
                          value={patientForm.complaint}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Address */}
                      <div className="mb-4">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea 
                          id="address"
                          placeholder="Enter full address"
                          rows={3}
                          value={patientForm.address}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* System Generated Information Notice */}
                      <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">System Generated Information</h3>
                        <p className="text-sm text-gray-600">Registration No, OP No, Date, and Time will be automatically generated by the system.</p>
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAddPatient(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                          {loading && (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          )}
                          {loading ? 'Saving...' : 'Save Patient'}
                        </button>
                      </div>
                    </form>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            {/* Notifications */}
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button 
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed top-[4rem] right-4 bg-white rounded-lg shadow-xl w-full max-w-sm">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <Dialog.Title className="text-lg font-semibold">Notifications</Dialog.Title>
                      <Dialog.Close className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                      </Dialog.Close>
                    </div>
                    <div className="space-y-3">
                      {notifications.map(notification => (
                        <div key={notification.id} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-800">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            {/* Settings */}
            <Dialog.Root open={showSettings} onOpenChange={setShowSettings}>
              <Dialog.Trigger asChild>
                <button 
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <Dialog.Title className="text-xl font-semibold">Settings</Dialog.Title>
                      <Dialog.Close className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                      </Dialog.Close>
                    </div>
                    <div className="space-y-6">
                      {/* Reminders Section */}
                      <div>
                        <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><AlarmClock className="w-5 h-5" /> Reminders</h3>
                        <form className="flex flex-col gap-2 mb-4" onSubmit={addReminder}>
                          <div className="flex gap-2">
                            <div className="flex flex-col flex-1">
                              <label htmlFor="reminder-time" className="text-xs text-gray-600 mb-1">Time</label>
                              <input
                                id="reminder-time"
                                type="datetime-local"
                                value={reminderTime}
                                onChange={e => setReminderTime(e.target.value)}
                                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                title="Select reminder date and time"
                                placeholder="Select date and time"
                              />
                            </div>
                            <div className="flex flex-col flex-1">
                              <label htmlFor="reminder-note" className="text-xs text-gray-600 mb-1">Note</label>
                              <input
                                id="reminder-note"
                                type="text"
                                value={reminderNote}
                                onChange={e => setReminderNote(e.target.value)}
                                placeholder="Reminder note"
                                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                title="Enter reminder note"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="bg-blue-500 text-white w-full h-[42px] rounded-lg hover:bg-blue-600 flex items-center justify-center"
                          >
                            Add
                          </button>
                        </form>
                        <ul className="space-y-2">
                          {reminders.map(rem => (
                            <li key={rem.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                              <span className="flex-1">
                                <span className="font-semibold">{new Date(rem.time).toLocaleString()}</span>: {rem.note}
                              </span>
                              <button onClick={() => removeReminder(rem.id)} className="ml-2 text-red-500 hover:text-red-700">Remove</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-3">Notifications</h3>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3">
                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600" />
                            <span>Email notifications</span>
                          </label>
                          <label className="flex items-center gap-3">
                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600" />
                            <span>Desktop notifications</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-3">Theme</h3>
                        <select 
                          id="theme" 
                          aria-label="Theme selection"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option>Light</option>
                          <option>Dark</option>
                          <option>System</option>
                        </select>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-3">Language</h3>
                        <select 
                          id="language"
                          aria-label="Language selection"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option>English</option>
                          <option>Spanish</option>
                          <option>French</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <Dialog.Close className="px-4 py-2 text-gray-600 hover:text-gray-800">
                        Cancel
                      </Dialog.Close>
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Save Changes
                      </button>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            {/* Doctor Profile */}
            <Dialog.Root open={showProfile} onOpenChange={setShowProfile}>
              <Dialog.Trigger asChild>
                <div className="flex items-center gap-3 cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">
                      {doctorInfo?.name ? doctorInfo.name : 'Doctor Profile'}
                    </p>
                    <p className="text-xs text-gray-500">View Profile</p>
                  </div>
                </div>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Dialog.Title className="text-lg font-semibold">Doctor Profile</Dialog.Title>
                      <Dialog.Close className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                      </Dialog.Close>
                    </div>
                    
                    <div className="mt-2 space-y-5">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input 
                          id="fullName"
                          type="text" 
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700" 
                          value={doctorInfo?.name || ''}
                          placeholder="Doctor name not available"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 mb-1">Doctor ID</label>
                        <input 
                          id="doctorId"
                          type="text" 
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700" 
                          value={doctorInfo?.doctorId || ''}
                          placeholder="ID not available"
                          readOnly
                        />
                      </div>

                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <input 
                          id="role"
                          type="text" 
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700" 
                          value={doctorInfo?.role || 'DOCTOR'}
                          placeholder="Role not available"
                          readOnly
                        />
                      </div>

                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <input 
                          id="status"
                          type="text" 
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700" 
                          value={doctorInfo?.status || 'Not set'}
                          placeholder="Status not available"
                          readOnly
                        />
                      </div>

                      <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <input 
                          id="department"
                          type="text" 
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700" 
                          value={doctorInfo?.department || 'Not set'}
                          placeholder="Department not available"
                          readOnly
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input 
                          id="email"
                          type="email" 
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700" 
                          value={doctorInfo?.email || ''}
                          placeholder="Email not available"
                          readOnly
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-center">
                      <Dialog.Close asChild>
                        <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                          Close
                        </button>
                      </Dialog.Close>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            {/* User Actions */}
            <div className="flex items-center gap-3">
              {/* Logout Button with Confirmation */}
              <AlertDialog.Root>
                <AlertDialog.Trigger asChild>
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
                  <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                    <AlertDialog.Title className="text-lg font-semibold mb-2">
                      Logout Confirmation
                    </AlertDialog.Title>
                    <AlertDialog.Description className="text-gray-600 mb-6">
                      Are you sure you want to logout?
                    </AlertDialog.Description>
                    <div className="flex justify-end gap-3">
                      <AlertDialog.Cancel asChild>
                        <button
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          No
                        </button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action asChild>
                        <button
                          onClick={handleLogout}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Yes
                        </button>
                      </AlertDialog.Action>
                    </div>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              </AlertDialog.Root>
            </div>
          </div>
        </div>
      </div>

      {/* Reminder Popup */}
      {showReminderPopup && activeReminder && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center"
            style={{ width: '400px', maxWidth: '90vw' }}
          >
            <AlarmClock className="w-10 h-10 text-blue-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Reminder</h2>
            <p className="mb-4">{activeReminder.note}</p>
            <button
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              onClick={() => setShowReminderPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;