import React, { useState, useEffect } from 'react';
import { PatientsList } from './components/PatientsList';
import { PatientDetails } from './components/PatientDetails';
import { Navbar } from './components/Navbar';
import Login from './components/Login';
import type { Patient, DoctorAuth } from './types';
import { fetchPatientsByCategory, checkLoggedInStatus, logoutDoctor } from './services/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [doctorInfo, setDoctorInfo] = useState<DoctorAuth | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientUpdateCounter, setPatientUpdateCounter] = useState<number>(0);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);

  // Check login status on app load
  useEffect(() => {
    const storedDoctorInfo = checkLoggedInStatus();
    if (storedDoctorInfo?.authenticated) {
      setIsLoggedIn(true);
      setDoctorInfo(storedDoctorInfo);
    }
  }, []);

  const handleClosePatientDetails = () => {
    setSelectedPatient(null);
  };

  const onPatientUpdated = () => {
    setPatientUpdateCounter(prev => prev + 1);
  };

  // Handle user logout
  const handleLogout = () => {
    logoutDoctor();
    setIsLoggedIn(false);
    setDoctorInfo(null);
    setSelectedPatient(null);
  };

  // Handle user login
  const handleLogin = (doctorInfo?: DoctorAuth) => {
    setIsLoggedIn(true);
    if (doctorInfo) {
      setDoctorInfo(doctorInfo);
    }
  };

  // Fetch all patients to have a reference for finding the next one
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const loadPatients = async () => {
      try {
        const patients = await fetchPatientsByCategory('today');
        setAllPatients(patients);
      } catch (error) {
        console.error("Error loading patients:", error);
      }
    };
    
    loadPatients();
    
    // Adding a fixed interval to refresh the patient list only occasionally
    // This will keep the list stable during normal operations but update it periodically
    const intervalId = setInterval(loadPatients, 60000); // Refresh every 60 seconds
    
    return () => clearInterval(intervalId);
  }, [isLoggedIn]); // Run when login status changes

  // Function to select the next patient after consultation
  const handleSelectNextPatient = (currentPatient: Patient) => {
    if (!currentPatient || allPatients.length === 0) {
      // No current patient or no patients in list - close panel
      handleClosePatientDetails();
      return;
    }
    
    // Find the index of the current patient
    const currentIndex = allPatients.findIndex(
      p => p.patientId === currentPatient.patientId || p.id === currentPatient.id
    );
    
    // If patient not found or it's the last patient in the list, close the panel
    if (currentIndex === -1 || currentIndex >= allPatients.length - 1) {
      handleClosePatientDetails();
      return;
    }
    
    // Set the next patient (we already verified there is one)
    setSelectedPatient(allPatients[currentIndex + 1]);
    
    // Fast direct scroll to top of the details panel
    window.scrollTo(0, 0);
    
    // Don't call onPatientUpdated() here as it would trigger a refresh of the patient list
  };

  // Function to handle initial patient selection and scroll to top
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    
    // Faster, more direct scrolling approach
    const scrollToTop = () => {
      // Method 1: Direct scroll reset - fastest approach
      const panel = document.querySelector('.patient-details-panel');
      if (panel) {
        panel.scrollTop = 0;
      }
      
      // Method 2: Force global scroll reset
      window.scrollTo({
        top: 0,
        behavior: 'auto' // Use 'auto' instead of 'smooth' for speed
      });
    };
    
    // Immediate scroll
    scrollToTop();
    
    // Backup scroll after component has rendered
    setTimeout(scrollToTop, 50);
  };

  // If not logged in, show login page
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar 
        onPatientUpdated={onPatientUpdated} 
        onLogout={handleLogout} 
        doctorInfo={doctorInfo}
      />
      <div className="flex-1 mt-16">
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Fixed Patient List Card */}
            <div className="lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
              <div className="bg-white rounded-lg shadow-md h-[calc(100vh-5rem)]">
                <PatientsList 
                  onSelectPatient={handleSelectPatient} 
                  refreshTrigger={patientUpdateCounter}
                />
              </div>
            </div>
            
            {/* Right Column - Scrollable Patient Details */}
            <div className="lg:col-span-8">
              <div className="patient-details-panel min-h-[calc(100vh-5rem)] overflow-y-auto">
                <PatientDetails 
                  patient={selectedPatient} 
                  onClose={handleClosePatientDetails}
                  onSelectNextPatient={handleSelectNextPatient}
                  doctorInfo={doctorInfo}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;