import React, { useState, useEffect } from 'react';
import { Bell, Settings, LogOut, UserPlus, X, User, MessageCircle, AlarmClock } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { registerPatient, updateDoctorStatus, fetchActiveNurses } from '../services/api';
import type { DoctorAuth } from '../types';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface NavbarProps {
  onPatientUpdated?: () => void;
  onLogout?: () => void;
  doctorInfo?: DoctorAuth | null;
}

export function Navbar({ onPatientUpdated, onLogout, doctorInfo }: NavbarProps) {
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChat, setShowChat] = useState(false);
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
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const stompClientRef = React.useRef(null);
  const [userType, setUserType] = useState(null); // 'doctor' or 'nurse'
  const [userId, setUserId] = useState('');
  const [otherId, setOtherId] = useState('');
  const [chatSetupDone, setChatSetupDone] = useState(false);
  const [chatConnectionStatus, setChatConnectionStatus] = useState('disconnected'); // 'connected', 'disconnected', 'error'
  const [chatConnectionError, setChatConnectionError] = useState(null);
  const [nurses, setNurses] = useState([]);
  const [selectedNurse, setSelectedNurse] = useState(null);
  const [isLoadingNurses, setIsLoadingNurses] = useState(false);
  const [nurseError, setNurseError] = useState(null);

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

  // Fetch active nurses when chat box opens
  useEffect(() => {
    const fetchNurses = async () => {
      if (showChat) {
        setIsLoadingNurses(true);
        setNurseError(null);
        try {
          const response = await fetch('http://localhost:8082/api/nurses/active');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (!data || data.length === 0) {
            setNurseError('No active nurses available at the moment');
          } else {
            setNurses(data);
          }
          setSelectedNurse(null); // Reset selected nurse when opening chat
        } catch (error) {
          console.error('Error fetching nurses:', error);
          setNurseError('Failed to load nurses. Please check your connection and try again.');
        } finally {
          setIsLoadingNurses(false);
        }
      }
    };

    fetchNurses();
  }, [showChat]);

  // Add refresh functionality for nurses list
  const refreshNurses = async () => {
    setIsLoadingNurses(true);
    setNurseError(null);
    try {
      const response = await fetch('http://localhost:8082/api/nurses/active');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data || data.length === 0) {
        setNurseError('No active nurses available at the moment');
      } else {
        setNurses(data);
      }
    } catch (error) {
      console.error('Error refreshing nurses:', error);
      setNurseError('Failed to refresh nurses list. Please check your connection and try again.');
    } finally {
      setIsLoadingNurses(false);
    }
  };

  // Connect to WebSocket when a nurse is selected
  useEffect(() => {
    if (showChat && selectedNurse && !stompClientRef.current) {
      setChatConnectionStatus('connecting');
      setChatConnectionError(null);
      const socket = new SockJS('http://192.168.1.100:8082/ws-chat');
      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        onConnect: () => {
          setChatConnectionStatus('connected');
          client.subscribe('/user/queue/messages', (message) => {
            const msg = JSON.parse(message.body);
            setChatMessages((prev) => [...prev, { ...msg, from: msg.from, to: msg.to, content: msg.content, timestamp: msg.timestamp }]);
          });
        },
        onStompError: (frame) => {
          setChatConnectionStatus('error');
          setChatConnectionError(frame.headers['message'] || 'STOMP error');
          console.error('STOMP error:', frame);
        },
        onWebSocketError: (event) => {
          setChatConnectionStatus('error');
          setChatConnectionError('WebSocket error');
          console.error('WebSocket error:', event);
        },
        onWebSocketClose: () => {
          setChatConnectionStatus('disconnected');
        },
      });
      client.activate();
      stompClientRef.current = client;
    }
    return () => {
      if (!showChat && stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [showChat, selectedNurse]);

  // Send chat message
  function sendChatMessage(e) {
    e.preventDefault();
    if (!chatInput.trim() || !stompClientRef.current || chatConnectionStatus !== 'connected' || !selectedNurse) return;
    const msg = {
      from: doctorInfo?.doctorId || '',
      to: selectedNurse.nurse_id,
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    stompClientRef.current.publish({
      destination: '/app/chat',
      body: JSON.stringify(msg),
    });
    setChatMessages((prev) => [...prev, { ...msg }]);
    setChatInput('');
  }

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

            {/* Chat Button */}
            <Dialog.Root open={showChat} onOpenChange={setShowChat}>
              <Dialog.Trigger asChild>
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                <Dialog.Content className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl w-full max-w-md p-0 overflow-hidden flex flex-col" style={{ minHeight: '400px', maxHeight: '80vh' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="font-semibold text-lg">
                      {selectedNurse ? `Chat with ${selectedNurse.name}` : 'Select a Nurse'}
                    </span>
                    <Dialog.Close className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </Dialog.Close>
                  </div>

                  {!selectedNurse ? (
                    <div className="flex-1 p-4 overflow-y-auto">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-sm text-gray-700">Active Nurses:</h4>
                        <button 
                          onClick={refreshNurses}
                          className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1"
                          disabled={isLoadingNurses}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </button>
                      </div>
                      {isLoadingNurses ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      ) : nurseError ? (
                        <div className="text-red-500 text-center p-4">
                          <p className="mb-2">{nurseError}</p>
                          <button 
                            onClick={refreshNurses}
                            className="mt-2 text-blue-500 hover:text-blue-600 flex items-center justify-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Try again
                          </button>
                        </div>
                      ) : nurses.length === 0 ? (
                        <div className="text-gray-400 italic text-center p-4">
                          No active nurses available
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {nurses.map(nurse => (
                            <li 
                              key={nurse.nurse_id} 
                              className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                              onClick={() => setSelectedNurse(nurse)}
                            >
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{nurse.name}</p>
                                <p className="text-sm text-gray-500">ID: {nurse.nurse_id}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <>
                      {chatConnectionStatus !== 'connected' && (
                        <div className="p-2 bg-red-100 text-red-700 rounded mb-2 text-center">
                          {chatConnectionStatus === 'connecting' && 'Connecting to chat...'}
                          {chatConnectionStatus === 'disconnected' && 'Not connected to chat server.'}
                          {chatConnectionStatus === 'error' && `Connection error: ${chatConnectionError || ''}`}
                        </div>
                      )}
                      <div className="flex-1 p-4 overflow-y-auto" style={{ background: '#f7fafc' }}>
                        {chatMessages.length === 0 ? (
                          <div className="text-gray-500 text-center mt-10">No messages yet.</div>
                        ) : (
                          <ul className="space-y-2">
                            {chatMessages.map((msg, idx) => (
                              <li key={idx} className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.from === doctorInfo?.doctorId ? 'bg-blue-100 ml-auto text-right' : 'bg-green-100 mr-auto text-left'}`}>
                                <div className="text-sm">{msg.content}</div>
                                <div className="text-xs text-gray-500 mt-1">{msg.timestamp}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <form className="flex items-center border-t p-3 gap-2" onSubmit={sendChatMessage}>
                        <input
                          type="text"
                          className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Type a message..."
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                        />
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">Send</button>
                      </form>
                    </>
                  )}
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