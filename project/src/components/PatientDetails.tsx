/**
 * PatientDetails Component
 * 
 * Database Schema Integration Notes:
 * labtests table schema:
 * - test_id (PK): bigint
 * - visit_id (FK): bigint - references visits(visit_id)
 * - test_name: varchar(255)
 * - reference_range: varchar(255)
 * - result: varchar(255)
 * - status: varchar(255)
 * 
 * Important: Always use snake_case property names when sending data to the API
 * for lab tests to match the database schema.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  CalendarDays, 
  Edit, 
  Plus, 
  Save, 
  X,
  Check, 
  ChevronRight, 
  Mic, 
  MicOff,
  FileText,
  PenTool,
  Clock,
  User,
  Activity,
  Scale,
  Printer,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  TestTube,
  Thermometer,
  RefreshCw
} from 'lucide-react';
import type { Patient, Visit, LabTest } from '../types';
import { commonLabTests } from '../types';
import { savePrescription, saveLabTests, addLabTest, fetchLabTestsByVisitId, fetchVisitsWithLabTestsByPatientId, saveNotes, diagnoseLabTestApi, refreshPatientDetails, fixTemperatureData } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// At the top, import DoctorAuth
type DoctorAuth = import('../types').DoctorAuth;

// Define speech recognition types for TypeScript
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

// Add this as an interface declaration to fix window property issues
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

// Add SpeechRecognition interface definition to fix TypeScript errors
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface PatientDetailsProps {
  patient: Patient | null;
  onClose?: () => void;
  onSelectNextPatient?: (patient: Patient) => void;
  doctorInfo?: DoctorAuth | null;
}

export function PatientDetails({ patient, onClose, onSelectNextPatient, doctorInfo }: PatientDetailsProps) {
  const [prescriptionText, setPrescriptionText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [prescriptionInputMethod, setPrescriptionInputMethod] = useState<'text' | 'voice' | 'manual'>('text');
  const [notesInputMethod, setNotesInputMethod] = useState<'text' | 'voice' | 'manual'>('text');
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);
  const [showVisitHistory, setShowVisitHistory] = useState(false);
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [visitError, setVisitError] = useState<string | null>(null);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');
  const [currentVisitId, setCurrentVisitId] = useState<string | number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);

  // New state variables
  const [loadingLabTests, setLoadingLabTests] = useState<boolean>(false);
  const [labTestsError, setLabTestsError] = useState<string | null>(null);
  const [showTestDropdown, setShowTestDropdown] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshingData, setRefreshingData] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(patient);
  // Add state for active tab in visit history dropdown
  const [activeVisitTab, setActiveVisitTab] = useState<'history' | 'vitals' | 'labtests'>('history');
  // Add state for vitals graph tab
  const [activeVitalsTab, setActiveVitalsTab] = useState<'bp' | 'weight' | 'temperature'>('bp');
  
  // Update currentPatient when patient prop changes
  useEffect(() => {
    setCurrentPatient(patient);
  }, [patient]);

  // Setup speech recognition
  useEffect(() => {
    // Check if SpeechRecognition is available in the browser
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      console.error('Speech recognition not supported in this browser');
      return;
    }
    
    // Create a new instance of SpeechRecognition
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Set language to English
    
    // Event handler for speech recognition results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('Speech recognition result received:', event);
      let finalTranscript = '';
      let interimTranscript = '';
      
      // Get the latest transcript
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Log what we're capturing to debug
      if (finalTranscript || interimTranscript) {
        console.log('Final transcript:', finalTranscript);
        console.log('Interim transcript:', interimTranscript);
      }
      
      if (finalTranscript) {
        if (prescriptionInputMethod === 'voice') {
          // Append new transcript to existing text with proper spacing
          setPrescriptionText(prevText => {
            const trimmedPrev = prevText.trim();
            const trimmedNew = finalTranscript.trim();
            if (!trimmedPrev) return trimmedNew;
            return trimmedPrev + ' ' + trimmedNew;
          });
        } else if (notesInputMethod === 'voice') {
          setNotesText(prevText => {
            const trimmedPrev = prevText.trim();
            const trimmedNew = finalTranscript.trim();
            if (!trimmedPrev) return trimmedNew;
            return trimmedPrev + ' ' + trimmedNew;
          });
        }
      }
    };
    
    // Error handler
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      setIsListening(false);
      showFeedbackMessage(`Error with voice recognition: ${event.error}. Please try again or switch to text input.`, 'error');
    };
    
    // End event handler
    recognition.onend = () => {
      console.log('Speech recognition ended');
      
      // Only set isListening to false if the user manually stopped it
      if (!recognition.continuous) {
        setIsListening(false);
      } else if (isListening) {
        // If it's still supposed to be listening, restart it
        try {
          recognition.start();
          console.log('Speech recognition restarted');
        } catch (err) {
          console.error('Error restarting speech recognition:', err);
          setIsListening(false);
          showFeedbackMessage('Voice recognition stopped unexpectedly. Please try again.', 'error');
        }
      }
    };
    
    setSpeechRecognition(recognition);
    
    // Cleanup
    return () => {
      if (recognition) {
        try {
          recognition.stop();
          console.log('Speech recognition stopped on cleanup');
        } catch (err) {
          console.error('Error stopping speech recognition on cleanup:', err);
        }
      }
    };
  }, [isListening]);

  // Toggle voice recognition
  const toggleVoiceRecognition = (inputType: 'prescription' | 'notes') => {
    if (!speechRecognition) {
      showFeedbackMessage('Speech recognition is not supported in your browser.', 'error');
      return;
    }
    
    if (isListening) {
      // Stop listening
      try {
        speechRecognition.stop();
        console.log('Speech recognition stopped by user');
        setIsListening(false);
        showFeedbackMessage('Voice recording stopped.', 'success');
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
        showFeedbackMessage('Failed to stop voice recording. Please try again.', 'error');
      }
    } else {
      // Start listening
      try {
        // Set the appropriate input method first
        if (inputType === 'prescription') {
          setPrescriptionInputMethod('voice');
        } else {
          setNotesInputMethod('voice');
        }

        // Need a small delay to ensure the UI updates before starting recognition
        setTimeout(() => {
          try {
            speechRecognition.start();
            console.log('Speech recognition started');
            setIsListening(true);
            showFeedbackMessage('Voice recording started. Speak now...', 'success');
          } catch (err) {
            console.error('Error starting speech recognition:', err);
            showFeedbackMessage('Failed to start voice recording. Please try again.', 'error');
          }
        }, 100);
      } catch (err) {
        console.error('Error preparing speech recognition:', err);
        showFeedbackMessage('Failed to prepare voice recording. Please try again.', 'error');
      }
    }
  };

  // Fetch visit history when patient is selected and history is shown
  useEffect(() => {
    const fetchVisitHistory = async () => {
      if (patient) {
        try {
          setLoadingVisits(true);
          // Ensure patientId is always a string
          const patientId = (patient.patientId || patient.id || '').toString();
          
          // Skip API call if patientId is empty
          if (!patientId) {
            setVisitError('Patient ID is missing. Cannot fetch visit history.');
            setVisits([]);
            setLoadingVisits(false);
            return;
          }
          
          const visitData = await fetchVisitsWithLabTestsByPatientId(patientId);
          console.log('Raw visit data:', visitData);
          
          // Format dates correctly for sorting
          const processedVisitData = visitData.map(visit => {
            // Make sure we have valid visitDate and visitTime to work with
            if (!visit.visitDate) {
              console.warn('Visit missing date:', visit);
              return { ...visit, _sortableDate: new Date(0) };
            }
            
            try {
              // Parse date in the correct format
              let dateObj;
              
              if (visit.visitTime) {
                // Try handling various time formats
                let formattedTime = visit.visitTime;
                // If time is in format like "10:00 am" or "10:00 PM", convert to 24-hour format
                if (formattedTime.toLowerCase().includes('am') || formattedTime.toLowerCase().includes('pm')) {
                  const [timePart, meridiem] = formattedTime.split(' ');
                  const [hours, minutes] = timePart.split(':').map(Number);
                  
                  let hour = hours;
                  
                  // Convert to 24-hour format
                  if (meridiem.toLowerCase() === 'pm' && hours < 12) {
                    hour = hours + 12;
                  } else if (meridiem.toLowerCase() === 'am' && hours === 12) {
                    hour = 0;
                  }
                  
                  formattedTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                }
                
                // Try to create date with ISO format
                dateObj = new Date(`${visit.visitDate}T${formattedTime}`);
                
                if (isNaN(dateObj.getTime())) {
                  // Fall back to a different approach if the first attempt fails
                  const [year, month, day] = visit.visitDate.split('-').map(Number);
                  const [hours, minutes] = formattedTime.split(':').map(Number);
                  
                  dateObj = new Date(year, month - 1, day, hours, minutes);
                }
              } else {
                // If we only have the date, use noon as the default time
                dateObj = new Date(`${visit.visitDate}T12:00:00`);
              }
              
              // Final validation
              if (isNaN(dateObj.getTime())) {
                console.warn('Invalid date after processing:', visit);
                dateObj = new Date(0);
              }
              
              return { ...visit, _sortableDate: dateObj };
            } catch (error) {
              console.error('Error parsing date:', error);
              return { ...visit, _sortableDate: new Date(0) };
            }
          });
          
          // Sort visits in reverse chronological order using the sortable date
          const sortedVisits = [...processedVisitData].sort((a, b) => {
            return b._sortableDate.getTime() - a._sortableDate.getTime();
          });
          
          console.log('Sorted visits:', sortedVisits.map(v => ({
            id: v.visitId,
            date: v.visitDate,
            time: v.visitTime,
            sortableDate: v._sortableDate
          })));
          
          setVisits(sortedVisits);
          
          // Set the current visit ID if visits are available
          if (sortedVisits.length > 0 && sortedVisits[0].visitId) {
            // Use the most recent visit as the current visit
            setCurrentVisitId(sortedVisits[0].visitId);
            
            // Clear prescription text when changing patients
            setPrescriptionText('');
            setSelectedLabTests([]);
          }
          
          setVisitError(null);
        } catch (err) {
          console.error('Error fetching visit history:', err);
          setVisitError('Failed to load visit history. Please try again later.');
          setVisits([]);
        } finally {
          setLoadingVisits(false);
        }
      }
    };

    fetchVisitHistory();
  }, [patient]);

  // Fetch current visit when patient is selected but history not shown
  useEffect(() => {
    const fetchCurrentVisit = async () => {
      if (patient && !showVisitHistory) {
        try {
          // Ensure patientId is always a string
          const patientId = (patient.patientId || patient.id || '').toString();
          
          // Skip API call if patientId is empty
          if (!patientId) {
            return;
          }
          
          const visitData = await fetchVisitsWithLabTestsByPatientId(patientId);
          
          // Set the current visit ID if visits are available
          if (visitData && visitData.length > 0 && visitData[0].visitId) {
            // Use the most recent visit as the current visit
            setCurrentVisitId(visitData[0].visitId);
          }
        } catch (err) {
          console.error('Error fetching current visit:', err);
        }
      }
    };

    fetchCurrentVisit();
  }, [patient]);

  // Extract unique categories from commonLabTests
  const labTestCategories = React.useMemo(() => {
    const categories = commonLabTests.map(test => test.category || '');
    // Remove duplicates and filter out empty categories
    const uniqueCategories = [...new Set(categories)].filter(Boolean);
    return uniqueCategories;
  }, []);

  const handleSavePrescription = async () => {
    if (!currentVisitId) {
      showFeedbackMessage('No active visit found for this patient', 'error');
      return;
    }
    
    // Check if prescription is empty and no lab tests are selected and notes is empty
    if (prescriptionText.trim() === '' && selectedLabTests.length === 0 && notesText.trim() === '') {
      showFeedbackMessage('Prescription is empty, no lab tests selected, and no notes provided', 'error');
      return;
    }
    
    try {
      setSavingPrescription(true);
      
      // CRITICAL: Always ensure we're using the most recent visit ID and patient ID
      const patientId = (patient?.patientId || patient?.id || '').toString();
      
      if (!patientId) {
        showFeedbackMessage('Patient ID is missing. Cannot save prescription.', 'error');
        setSavingPrescription(false);
        return;
      }
      
      // Re-fetch the visits to get the most current visit ID
      const latestVisitData = await fetchVisitsWithLabTestsByPatientId(patientId);
      
      // Sort to get the most recent visit
      const sortedVisits = [...latestVisitData].sort((a, b) => {
        const dateA = a.visitDate ? new Date(a.visitDate) : new Date(0);
        const dateB = b.visitDate ? new Date(b.visitDate) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Ensure we have the most recent visit
      if (sortedVisits.length === 0 || !sortedVisits[0].visitId) {
        throw new Error('No current visit found for this patient');
      }
      
      // Use the most recent visit ID, not the one from state which might be stale
      const mostRecentVisitId = sortedVisits[0].visitId;
      console.log('Saving prescription to CURRENT visit ID:', mostRecentVisitId);
      
      // Save prescription and notes together
      try {
        // Save both prescription and notes in a single API call to avoid potential overwrite issues
        await savePrescription(mostRecentVisitId, prescriptionText, notesText, doctorInfo?.doctorId);
        console.log('Prescription and notes saved successfully');
      } catch (saveError) {
        console.error('Error saving prescription and notes:', saveError);
        showFeedbackMessage('Failed to save prescription and notes. Please try again.', 'error');
          setSavingPrescription(false);
        return; // Exit early if saving fails
      }

      // 3. If lab tests are selected, save them separately to the labtests table
      let labTestsSaved = false;
      if (selectedLabTests.length > 0) {
        try {
          console.log('Starting lab test save process');
          
          // Format lab test data using camelCase naming
          const labTestsData = selectedLabTests.map(testId => {
            const test = commonLabTests.find(t => t.id === testId);
            if (!test) return null;
            
            console.log('Preparing lab test:', test);
            
            // Make sure visitId is a number and not a string
            const numericVisitId = Number(mostRecentVisitId);
            
            if (isNaN(numericVisitId)) {
              console.error(`Invalid visit ID: ${mostRecentVisitId} - must be numeric`);
              return null;
            }
            
            // According to types.ts, testName maps to test_name in the database
            return {
              visitId: numericVisitId,
              patientId: patientId,
              // Use testName which maps to test_name in the database (per types.ts comment)
              testName: test.testName || test.name || '',
              referenceRange: 'Pending',
              result: '',
              status: 'pending'
            };
          }).filter(Boolean);
          
          console.log('Lab tests prepared for saving:', labTestsData);
          
          if (labTestsData.length > 0) {
            try {
              // Save test data to local storage as backup
              try {
                localStorage.setItem('pendingLabTests', JSON.stringify(labTestsData));
                console.log('Saved lab tests to local storage as backup');
              } catch (storageError) {
                console.error('Failed to save to local storage:', storageError);
              }
              
              try {
                // First try batch saving all lab tests at once
                console.log(`Calling saveLabTests with visit ID: ${mostRecentVisitId}, patient ID: ${patientId}, and ${labTestsData.length} lab tests`);
              const savedLabTests = await saveLabTests(mostRecentVisitId, labTestsData, patientId);
              
                console.log('Lab tests save result:', savedLabTests);
                
                if (savedLabTests.length > 0) {
                  console.log('Successfully saved lab tests to database');
                  labTestsSaved = true;
                } else {
                  // If batch saving failed, try individual saves
                  console.warn('Batch save failed. Trying individual saves...');
                const savedTests = [];
                
                for (const test of labTestsData) {
                  try {
                    if (test) {
                        // Handle test as any type to avoid type errors
                        const testData: any = test;
                        const visitIdToUse = test.visitId || Number(mostRecentVisitId);
                        
                        console.log(`Attempting to save individual test: ${testData.name} for visit: ${visitIdToUse}`);
                        // Try up to 3 times to save each test
                        let attempt = 0;
                        let savedTest = null;
                        
                        while (attempt < 3 && !savedTest) {
                          try {
                            savedTest = await addLabTest({
                        ...test,
                              visitId: visitIdToUse,
                              patientId: test.patientId || patientId,
                              // Use testName which maps to test_name in the database
                              testName: testData.testName || testData.name || '',
                            }, visitIdToUse);
                            
                            if (savedTest) {
                              console.log(`Successfully saved test: ${testData.testName || testData.name || ''} on attempt ${attempt + 1}`);
                      savedTests.push(savedTest);
                            }
                          } catch (attemptError) {
                            console.error(`Attempt ${attempt + 1} failed for test ${testData.name}:`, attemptError);
                            // Short delay before retry
                            await new Promise(resolve => setTimeout(resolve, 500));
                          }
                          attempt++;
                        }
                    }
                  } catch (individualError) {
                      const testAny = test as any;
                      console.error(`Error saving individual test ${testAny?.name || 'unknown'}:`, individualError);
                  }
                }
                
                if (savedTests.length > 0) {
                  console.log(`Saved ${savedTests.length} of ${labTestsData.length} lab tests using individual approach`);
                  labTestsSaved = true;
                } else {
                    // All attempts failed
                    showFeedbackMessage(`Failed to save lab tests to the database. Please try again or contact support.`, 'error');
                  setSavingPrescription(false);
                  return; // Exit early to prevent further processing
                }
                }
              } catch (labError) {
                console.error('Error saving lab tests to API:', labError);
                // All attempts failed
                showFeedbackMessage(`Failed to save lab tests to database: ${labError instanceof Error ? labError.message : 'Unknown error'}`, 'error');
                setSavingPrescription(false);
                return; // Exit early
              }
            } catch (error: unknown) {
              // Type guard to check if it's an Error object
              let errorMessage = 'Failed to save lab tests. Please check console for details.';
              
              if (error instanceof Error) {
                errorMessage = `Failed to save lab test: ${error.message}`;
                console.error('Error details:', { 
                  error,
                  message: error.message
                });
              } else {
                // Handle non-Error types if necessary
                console.error('Caught non-Error type while saving lab tests:', error);
              }

              showFeedbackMessage(errorMessage, 'error');
              setSavingPrescription(false);
              return; // Exit early to prevent further processing
            }
          }
        } catch (error: unknown) {
          // Type guard to check if it's an Error object
          let errorMessage = 'Failed to save lab tests. Please check console for details.';
          
          if (error instanceof Error) {
            errorMessage = `Failed to save lab test: ${error.message}`;
            console.error('Error details:', { 
              error,
              message: error.message
            });
          } else {
            // Handle non-Error types if necessary
            console.error('Caught non-Error type while saving lab tests:', error);
          }

          showFeedbackMessage(errorMessage, 'error');
          setSavingPrescription(false);
          return; // Exit early to prevent further processing
        }
      }
      
      // Update UI to reflect the change - IMPORTANT: Re-fetch to get latest data including lab tests
      try {
        const refreshedVisitData = await fetchVisitsWithLabTestsByPatientId(patientId);
        console.log('Refreshed visit data after saving:', refreshedVisitData);
        
        // Process and sort the refreshed visit data
        const sortedRefreshedVisits = [...refreshedVisitData].sort((a, b) => {
          const dateA = a.visitDate ? new Date(a.visitDate) : new Date(0);
          const dateB = b.visitDate ? new Date(b.visitDate) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Update the visits state with the refreshed data
        setVisits(sortedRefreshedVisits);
        
        // Also update the current visit ID to ensure it's correct
        if (sortedRefreshedVisits.length > 0 && sortedRefreshedVisits[0].visitId) {
          setCurrentVisitId(sortedRefreshedVisits[0].visitId);
        }
      } catch (refreshError) {
        console.error('Error refreshing visit data:', refreshError);
        // No need to show feedback as we've already saved the data
      }
      
      // Show appropriate feedback
      let labTestsData: any[] = [];
      let savedTests: any[] = [];
      
      if ((prescriptionText.trim() || notesText.trim()) && labTestsSaved) {
        // Since we don't have accurate counts for partial success scenarios, just show full success
        showFeedbackMessage('Prescription, notes, and lab tests saved successfully', 'success');
        // Show 'consulted' message after a delay
        showFeedbackMessage('Consulted', 'success', 3500);
      } else if (prescriptionText.trim() && notesText.trim()) {
        showFeedbackMessage('Prescription and notes saved successfully', 'success');
        // Show 'consulted' message after a delay
        showFeedbackMessage('Consulted', 'success', 3500);
      } else if (prescriptionText.trim()) {
        showFeedbackMessage('Prescription saved successfully', 'success');
        // Show 'consulted' message after a delay
        showFeedbackMessage('Consulted', 'success', 3500);
      } else if (notesText.trim()) {
        showFeedbackMessage('Notes saved successfully', 'success');
        // Show 'consulted' message after a delay
        showFeedbackMessage('Consulted', 'success', 3500);
      } else if (labTestsSaved) {
        showFeedbackMessage('Lab tests saved successfully', 'success');
        // Show 'consulted' message after a delay
        showFeedbackMessage('Consulted', 'success', 3500);
      }
      
      // Clear selected lab tests after saving
      setSelectedLabTests([]);
      setShowTestDropdown(false);
      
      // Clear notes field after saving
      setNotesText('');
    } catch (error) {
      console.error('Failed to complete operation:', error);
      showFeedbackMessage('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setSavingPrescription(false);
    }
  };
  
  const showFeedbackMessage = (message: string, type: 'success' | 'error', delay = 0) => {
    setTimeout(() => {
    setFeedbackMessage(message);
    setFeedbackType(type);
    setShowFeedback(true);
    
    // Auto-hide the feedback after 3 seconds
    setTimeout(() => {
      setShowFeedback(false);
        
        // If this is the "Consulted" message and we have onSelectNextPatient function
        if (message === 'Consulted' && onSelectNextPatient && patient) {
          // Navigate to the next patient after consultation
          // This will automatically close the panel if no more patients are available
          onSelectNextPatient(patient);
        }
    }, 3000);
    }, delay);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Find the current visit from visits array (usually the first one)
    const currentVisit = visits.length > 0 ? visits[0] : null;
    const useCurrentVisitData = currentVisit !== null;

    const currentDate = new Date().toLocaleDateString();
    const selectedLabTestNames = selectedLabTests
      .map(testId => {
        // Make sure we're using the right property name (test_name or name)
        const test = commonLabTests.find(test => test.id === testId);
        return test ? (test.testName || test.name) : null;
      })
      .filter(Boolean)
      .join(', ');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Prescription - AROGITH</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .hospital-name {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin: 0;
            }
            .hospital-details {
              font-size: 14px;
              margin: 5px 0;
            }
            .doctor-info {
              font-size: 16px;
              margin: 10px 0;
            }
            .patient-details {
              margin: 20px 0;
              padding: 20px;
              border: 1px solid #ccc;
              border-radius: 8px;
            }
            .patient-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
            }
            .patient-header-item {
              flex: 1;
            }
            .patient-header-item.center {
              text-align: center;
            }
            .patient-header-item.right {
              text-align: right;
            }
            .patient-row {
              display: flex;
              margin-bottom: 10px;
            }
            .patient-row-item {
              flex: 1;
              padding: 3px 5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin-bottom: 15px;
            }
            .info-cell {
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              overflow: hidden;
            }
            .info-header {
              background-color: #f3f4f6;
              padding: 6px 10px;
              font-weight: 500;
              color: #4b5563;
              font-size: 13px;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-value {
              padding: 8px 10px;
              font-size: 15px;
            }
            .visit-info {
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px dashed #ccc;
            }
            .prescription {
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              text-align: right;
            }
            .signature {
              margin-top: 60px;
              border-top: 1px solid #333;
              width: 200px;
              float: right;
              text-align: center;
            }
            .current-visit-label {
              display: inline-block;
              background-color: #e0f2fe;
              color: #0369a1;
              font-size: 14px;
              padding: 2px 8px;
              border-radius: 4px;
              margin-left: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 14px;
            }
            table, th, td {
              border: 1px solid #ddd;
            }
            th {
              background-color: #f8f9fa;
              text-align: left;
              padding: 10px;
              font-weight: 500;
              color: #555;
            }
            td {
              padding: 8px 10px;
            }
            .status-pill {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              text-align: center;
            }
            .status-pending {
              background-color: #f3f4f6;
              color: #4b5563;
            }
            .status-completed {
              background-color: #dbeafe;
              color: #1e40af;
            }
            .status-normal {
              background-color: #d1fae5;
              color: #065f46;
            }
            .status-abnormal {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status-critical {
              background-color: #fee2e2;
              color: #b91c1c;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .current-visit-label {
                background-color: #e0f2fe !important;
                color: #0369a1 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .status-pill {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .status-pending {
                background-color: #f3f4f6 !important;
                color: #4b5563 !important;
              }
              .status-completed {
                background-color: #dbeafe !important;
                color: #1e40af !important;
              }
              .status-normal {
                background-color: #d1fae5 !important;
                color: #065f46 !important;
              }
              .status-abnormal {
                background-color: #fef3c7 !important;
                color: #92400e !important;
              }
              .status-critical {
                background-color: #fee2e2 !important;
                color: #b91c1c !important;
              }
              .info-header {
                background-color: #f3f4f6 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="hospital-name">AROGITH</h1>
            <p class="hospital-details">123 Healthcare Avenue, Medical District</p>
            <p class="hospital-details">Phone: (555) 123-4567 | Email: care@arogith.com</p>
          </div>

          <div class="patient-details">
            <div class="patient-header">
              <div class="patient-header-item">
                <h2 style="margin: 0; font-size: 18px;">${patient?.name || 'N/A'}</h2>
              </div>
              <div class="patient-header-item center">
                <h3 style="margin: 0; font-size: 16px; font-weight: normal;">${patient?.age} years, ${patient?.gender}</h3>
              </div>
              <div class="patient-header-item right">
                <h3 style="margin: 0; font-size: 16px; font-weight: normal;">Date: ${currentDate}</h3>
              </div>
            </div>
            
            <div class="info-grid">
              <div class="info-cell">
                <div class="info-header">Registration No</div>
                <div class="info-value">${patient?.regNo || 'N/A'}</div>
              </div>
              <div class="info-cell">
                <div class="info-header">OP No</div>
                <div class="info-value">${patient?.opNo || 'N/A'}</div>
              </div>
              <div class="info-cell">
                <div class="info-header">Status</div>
                <div class="info-value">${patient?.status || 'N/A'}</div>
              </div>
            </div>
            
            ${useCurrentVisitData ? `
            <div class="visit-info">
              <h3>Current Visit Details <span class="current-visit-label">Current</span></h3>
              
              <div class="patient-row">
                <div class="patient-row-item">
                  <strong>Visit Date:</strong> ${currentVisit.visitDate || 'N/A'}
                </div>
                <div class="patient-row-item">
                  <strong>Blood Pressure:</strong> ${currentVisit.bp || 'N/A'}
                </div>
                <div class="patient-row-item">
                  <strong>Weight:</strong> ${currentVisit.weight || 'N/A'}
                </div>
              </div>
              
              <div class="patient-row">
                <div class="patient-row-item">
                  <strong>Temperature:</strong> ${currentVisit.temperature || 'N/A'}
                </div>
                <div class="patient-row-item" style="flex: 2;">
                  <strong>Complaint:</strong> ${currentVisit.complaint || 'No complaint recorded'}
                </div>
              </div>
            </div>
            ` : `
            <div class="patient-row">
              <div class="patient-row-item">
                <strong>Blood Pressure:</strong> ${patient?.bp || 'N/A'}
              </div>
              <div class="patient-row-item">
                <strong>Weight:</strong> ${patient?.weight || 'N/A'}
              </div>
              <div class="patient-row-item">
                <strong>Temperature:</strong> ${patient?.temperature || 'N/A'}
              </div>
            </div>
            <div class="patient-row">
              <div class="patient-row-item" style="flex: 3;">
                <strong>Complaint:</strong> ${patient?.complaints || 'No complaint recorded'}
              </div>
            </div>
            `}
          </div>

          <div class="prescription">
            <h2>Current Prescription</h2>
            <p>${useCurrentVisitData && currentVisit.prescription ? currentVisit.prescription : (prescriptionText || 'No medications prescribed')}</p>
          </div>
          
          ${selectedLabTests.length > 0 ? `
          <div class="prescription">
            <h2>Lab Tests</h2>
            <table>
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Reference Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${selectedLabTests.map(testId => {
                  const test = commonLabTests.find(t => t.id === testId);
                  return test ? `
                  <tr>
                    <td>${test.testName || test.name}</td>
                    <td>Pending</td>
                    <td><span class="status-pill status-pending">pending</span></td>
                  </tr>
                  ` : '';
                }).join('')}
              </tbody>
            </table>
          </div>
          ` : (useCurrentVisitData && currentVisit.labtests && currentVisit.labtests.length > 0) ? `
          <div class="prescription">
            <h2>Lab Tests</h2>
            <table>
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Result</th>
                  <th>Reference Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${currentVisit.labtests.map(test => {
                  // Normalize the status field for display
                  let testStatus = (test.status || 'pending').toLowerCase();
                  let statusClass = '';
                  
                  // Determine the status display class
                  switch (testStatus) {
                    case 'normal':
                      statusClass = 'status-normal';
                      break;
                    case 'abnormal':
                      statusClass = 'status-abnormal';
                      break;
                    case 'critical':
                      statusClass = 'status-critical';
                      break;
                    case 'completed':
                      statusClass = 'status-completed';
                      break;
                    default:
                      statusClass = 'status-pending';
                  }
                  
                  const testName = (test.test_name || test.name || '');
                  const result = test.result || 'Pending';
                  const range = test.referenceRange || test.reference_range || 'Pending';
                  
                  return `
                  <tr>
                    <td>${testName}</td>
                    <td>${result}</td>
                    <td>${range}</td>
                    <td><span class="status-pill ${statusClass}">${testStatus}</span></td>
                  </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="prescription">
            <h2>Notes</h2>
            <p>${useCurrentVisitData && currentVisit.notes ? currentVisit.notes : (notesText || 'No additional notes')}</p>
          </div>

          <div class="footer">
            <div class="signature">
              <p>Doctor's Signature</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Fix handleLabTestSelect function to not override manually typed text
  const handleLabTestSelect = (testId: string) => {
    setSelectedLabTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
    
    // Do NOT update the prescription text when selecting lab tests
    // This ensures manually typed text remains in the prescription box
  };

  // Toggle lab test panel
  const toggleLabTests = () => {
    setShowTestDropdown(!showTestDropdown);
  };

  // Fix the error by handling the potential undefined value
  const toggleExpandedVisit = (visitId: string | number | undefined) => {
    if (visitId === undefined) return;
    
    const visitIdString = visitId.toString();
    setExpandedVisit(expandedVisit === visitIdString ? null : visitIdString);
  };

  // Get the last visit date (which should be the previous visit, not the current one)
  const getLastVisitDate = () => {
    // If we have at least 2 visits, the second one is the previous visit
    if (visits.length >= 2) {
      return visits[1].visitDate;
    }
    // If we only have one visit, or no visits, show 'N/A'
    return 'N/A';
  };

  const handleVisitClick = (visit: Visit) => {
    toggleExpandedVisit(visit.visitId);
    
    // Don't load prescription when clicking on previous visits
    // This prevents accidentally overwriting the current prescription
  };

  // Add function to print specific visit details
  const handlePrintVisit = (visit: Visit, e: React.MouseEvent) => {
    // Prevent the visit expansion toggle
    e.stopPropagation();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString();

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Visit Details - AROGITH</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .hospital-name {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin: 0;
            }
            .hospital-details {
              font-size: 14px;
              margin: 5px 0;
            }
            .patient-details {
              margin: 20px 0;
              padding: 20px;
              border: 1px solid #ccc;
              border-radius: 8px;
            }
            .patient-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
            }
            .patient-header-item {
              flex: 1;
            }
            .patient-header-item.center {
              text-align: center;
            }
            .patient-header-item.right {
              text-align: right;
            }
            .patient-row {
              display: flex;
              margin-bottom: 10px;
            }
            .patient-row-item {
              flex: 1;
              padding: 3px 5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin-bottom: 15px;
            }
            .info-cell {
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              overflow: hidden;
            }
            .info-header {
              background-color: #f3f4f6;
              padding: 6px 10px;
              font-weight: 500;
              color: #4b5563;
              font-size: 13px;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-value {
              padding: 8px 10px;
              font-size: 15px;
            }
            .visit-info {
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px dashed #ccc;
            }
            .prescription {
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              text-align: right;
            }
            .signature {
              margin-top: 60px;
              border-top: 1px solid #333;
              width: 200px;
              float: right;
              text-align: center;
            }
            .visit-date {
              font-weight: bold;
              color: #2563eb;
              font-size: 18px;
              margin-bottom: 15px;
              padding-bottom: 5px;
              border-bottom: 1px solid #e5e7eb;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 14px;
            }
            table, th, td {
              border: 1px solid #ddd;
            }
            th {
              background-color: #f8f9fa;
              text-align: left;
              padding: 10px;
              font-weight: 500;
              color: #555;
            }
            td {
              padding: 8px 10px;
            }
            .status-pill {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              text-align: center;
            }
            .status-pending {
              background-color: #f3f4f6;
              color: #4b5563;
            }
            .status-completed {
              background-color: #dbeafe;
              color: #1e40af;
            }
            .status-normal {
              background-color: #d1fae5;
              color: #065f46;
            }
            .status-abnormal {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status-critical {
              background-color: #fee2e2;
              color: #b91c1c;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .status-pill {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .status-pending {
                background-color: #f3f4f6 !important;
                color: #4b5563 !important;
              }
              .status-completed {
                background-color: #dbeafe !important;
                color: #1e40af !important;
              }
              .status-normal {
                background-color: #d1fae5 !important;
                color: #065f46 !important;
              }
              .status-abnormal {
                background-color: #fef3c7 !important;
                color: #92400e !important;
              }
              .status-critical {
                background-color: #fee2e2 !important;
                color: #b91c1c !important;
              }
              .info-header {
                background-color: #f3f4f6 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="hospital-name">AROGITH</h1>
            <p class="hospital-details">123 Healthcare Avenue, Medical District</p>
            <p class="hospital-details">Phone: (555) 123-4567 | Email: care@arogith.com</p>
          </div>

          <div class="patient-details">
            <div class="patient-header">
              <div class="patient-header-item">
                <h2 style="margin: 0; font-size: 18px;">${patient?.name || 'N/A'}</h2>
              </div>
              <div class="patient-header-item center">
                <h3 style="margin: 0; font-size: 16px; font-weight: normal;">${patient?.age} years, ${patient?.gender}</h3>
              </div>
              <div class="patient-header-item right">
                <h3 style="margin: 0; font-size: 16px; font-weight: normal;">Print Date: ${currentDate}</h3>
              </div>
            </div>
            
            <div class="info-grid">
              <div class="info-cell">
                <div class="info-header">Registration No</div>
                <div class="info-value">${patient?.regNo || 'N/A'}</div>
              </div>
              <div class="info-cell">
                <div class="info-header">OP No</div>
                <div class="info-value">${patient?.opNo || 'N/A'}</div>
              </div>
              <div class="info-cell">
                <div class="info-header">Status</div>
                <div class="info-value">${patient?.status || 'N/A'}</div>
              </div>
            </div>
            
            <div class="visit-date">Visit Date: ${visit.visitDate || 'N/A'}</div>
            
            <div class="patient-row">
              <div class="patient-row-item">
                <strong>Blood Pressure:</strong> ${visit.bp || 'N/A'}
              </div>
              <div class="patient-row-item">
                <strong>Weight:</strong> ${visit.weight || 'N/A'}
              </div>
              <div class="patient-row-item">
                <strong>Temperature:</strong> ${visit.temperature || 'N/A'}
              </div>
            </div>
            
            <div class="patient-row">
              <div class="patient-row-item" style="flex: 3;">
                <strong>Complaint:</strong> ${visit.complaint || 'No complaint recorded'}
              </div>
            </div>
          </div>

          <div class="prescription">
            <h2>Prescription</h2>
            <p>${visit.prescription || 'No medications prescribed'}</p>
          </div>
          
          ${visit.notes ? `
          <div class="prescription">
            <h2>Notes</h2>
            <p>${visit.notes}</p>
          </div>
          ` : ''}
          
          ${visit.labtests && visit.labtests.length > 0 ? `
          <div class="prescription">
            <h2>Lab Tests</h2>
            <table>
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Result</th>
                  <th>Reference Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${visit.labtests.map(test => {
                  // Normalize the status field for display
                  let testStatus = (test.status || 'pending').toLowerCase();
                  let statusClass = '';
                  
                  // Determine the status display class
                  switch (testStatus) {
                    case 'normal':
                      statusClass = 'status-normal';
                      break;
                    case 'abnormal':
                      statusClass = 'status-abnormal';
                      break;
                    case 'critical':
                      statusClass = 'status-critical';
                      break;
                    case 'completed':
                      statusClass = 'status-completed';
                      break;
                    default:
                      statusClass = 'status-pending';
                  }
                  
                  const testName = (test.test_name || test.name || '');
                  const result = test.result || 'Pending';
                  const range = test.referenceRange || test.reference_range || 'Pending';
                  
                  return `
                  <tr>
                    <td>${testName}</td>
                    <td>${result}</td>
                    <td>${range}</td>
                    <td><span class="status-pill ${statusClass}">${testStatus}</span></td>
                  </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="footer">
            <div class="signature">
              <p>Doctor's Signature</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Display logic for the visit history section
  const renderVisitHistory = () => {
    if (loadingVisits) {
      return (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (visitError) {
      return <div className="text-center p-4 text-red-500">{visitError}</div>;
    }
    
    if (visits.length === 0) {
      return <div className="text-center p-4 text-gray-500">No visit history found</div>;
    }
    
    // Get the patient ID for use in lab test fetching
    const patientId = (patient?.patientId || patient?.id || '').toString();
    
    return (
      <div className="space-y-4">
        {visits.map((visit, index) => (
          <div key={visit.visitId} className="border rounded-lg bg-white">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleVisitClick(visit)}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="font-medium">
                  {visit.visitDate} {index === 0 && <span className="text-blue-500 text-sm ml-2">(Current)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handlePrintVisit(visit, e)}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center justify-center"
                  title="Print this visit"
                >
                  <Printer className="w-4 h-4" />
                </button>
              {expandedVisit === visit.visitId?.toString() ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
              </div>
            </div>
            {expandedVisit === visit.visitId?.toString() && (
              <div className="p-4 border-t">
                {/* Doctor Info Block */}
                <div className="flex items-center gap-3 mb-4 bg-blue-50 rounded p-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-blue-900 flex items-center gap-1">
                      <User className="w-5 h-5 text-blue-600" /> Consulted Doctor:
                    </span>
                    <span className="text-gray-800 text-base">
                      <span className="font-medium text-gray-600 mr-1">Name:</span> {visit.doctorName || '--'}
                    </span>
                    <span className="text-gray-500 text-sm">ID: {visit.doctorId || '--'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-600">Blood Pressure</span>
                    </div>
                    <p className="text-xl font-semibold mt-1">{visit.bp}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-600">Weight</span>
                    </div>
                    <p className="text-xl font-semibold mt-1">{visit.weight}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-5 h-5 text-orange-600" />
                      <span className="text-sm text-gray-600">Temperature</span>
                    </div>
                    <p className="text-xl font-semibold mt-1">{visit.temperature || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Complaint</h4>
                    <p className="text-gray-700">{visit.complaint}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Symptoms</h4>
                    <p className="text-gray-700">{visit.symptoms || 'No symptoms recorded'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Prescription</h4>
                    <p className="text-gray-700">{visit.prescription || 'No prescription recorded'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-gray-700">{visit.notes || 'No notes recorded'}</p>
                  </div>
                  {/* Lab Tests section */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center justify-between">
                      <span>Lab Tests</span>
                      {(!visit.labtests || visit.labtests.length === 0) && visit.visitId && (
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation(); // Prevent visit collapse
                            // Display loading state
                            setLoadingLabTests(true);
                            setLabTestsError(null);
                            
                            try {
                              if (visit.visitId) {
                                console.log(`Fetching lab tests for visit ${visit.visitId}`);
                                const patientId = (patient?.patientId || patient?.id || '').toString();
                                
                                // Attempt to fetch lab tests
                                const fetchedLabTests = await fetchLabTestsByVisitId(visit.visitId, patientId);
                                
                                if (fetchedLabTests && fetchedLabTests.length > 0) {
                                  // Update this specific visit with the fetched lab tests
                                  setVisits(currentVisits => 
                                    currentVisits.map(v => 
                                      v.visitId === visit.visitId ? { ...v, labtests: fetchedLabTests } : v
                                    )
                                  );
                                  console.log(`Successfully loaded ${fetchedLabTests.length} lab tests`);
                                } else {
                                  setLabTestsError("No lab tests found for this visit");
                                }
                              }
                            } catch (error) {
                              console.error(`Error fetching lab tests:`, error);
                              setLabTestsError(error instanceof Error ? error.message : "Failed to load lab tests");
                            } finally {
                              setLoadingLabTests(false);
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {loadingLabTests ? "Loading..." : "Refresh"}
                        </button>
                      )}
                    </h4>
                    {(!visit.labtests || visit.labtests.length === 0) ? (
                      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                        {loadingLabTests ? (
                          <div className="flex justify-center items-center py-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                            <span className="ml-2">Loading lab tests...</span>
                          </div>
                        ) : labTestsError ? (
                          <div className="text-red-500">
                            {formatErrorMessage(labTestsError)}
                            <div className="flex mt-3 space-x-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLabTestsError(null);
                                }}
                                className="text-blue-500 hover:text-blue-700 text-sm px-3 py-1 border border-blue-300 rounded-md"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  
                                  // Show loading state
                                  setLoadingLabTests(true);
                                  setLabTestsError(null);
                                  
                                  try {
                                    // Try to run diagnostic
                                    await diagnoseLabTestApi();
                                    
                                    // Retry fetch
                                    if (visit.visitId) {
                                      const patientId = (patient?.patientId || patient?.id || '').toString();
                                      const fetchedLabTests = await fetchLabTestsByVisitId(visit.visitId, patientId);
                                      
                                      if (fetchedLabTests && fetchedLabTests.length > 0) {
                                        setVisits(currentVisits => 
                                          currentVisits.map(v => 
                                            v.visitId === visit.visitId ? { ...v, labtests: fetchedLabTests } : v
                                          )
                                        );
                                        console.log(`Successfully loaded ${fetchedLabTests.length} lab tests`);
                                      } else {
                                        setLabTestsError("No lab tests found for this visit");
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Retry failed:', error);
                                    setLabTestsError(error instanceof Error ? error.message : "Failed to load lab tests");
                                  } finally {
                                    setLoadingLabTests(false);
                                  }
                                }}
                                className="text-blue-500 hover:text-blue-700 text-sm px-3 py-1 border border-blue-300 rounded-md"
                              >
                                Run Diagnostics & Retry
                              </button>
                            </div>
                          </div>
                        ) : (
                          "No reports found"
                        )}
                      </div>
                    ) : (
                      <div className="bg-white rounded border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="text-left p-2 font-medium text-gray-700">Test ID</th>
                              <th className="text-left p-2 font-medium text-gray-700">Test Name</th>
                              <th className="text-left p-2 font-medium text-gray-700">Result</th>
                              <th className="text-left p-2 font-medium text-gray-700">Reference Range</th>
                              <th className="text-left p-2 font-medium text-gray-700">Status</th>
                              <th className="text-left p-2 font-medium text-gray-700">Test Date</th>
                              <th className="text-left p-2 font-medium text-gray-700">Results Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visit.labtests.map((test, index) => {
                              // Get test ID using both camelCase and snake_case properties
                              const id = (test as any).testId || (test as any).test_id || index;
                              
                              // Handle both new and old format of lab tests
                              const testName = (test as any).testName || (test as any).test_name || test.name || '';
                              const testResult = test.result || 'Pending';
                              const testRange = test.referenceRange || test.reference_range || 'Pending';
                              
                              // Format timestamps if available
                              const testDate = (test as any).testGivenAt || (test as any).test_given_at || '';
                              const resultDate = (test as any).resultUpdatedAt || (test as any).result_updated_at || '';
                              
                              // Output raw values for debugging
                              console.log(`Raw date values for test ${id}:`, {
                                raw: test,
                                rawTestDate: testDate,
                                rawResultDate: resultDate,
                                testKeys: Object.keys(test)
                              });
                              
                              // Direct extraction of date values
                              let formattedTestDate = 'Not recorded';
                              let formattedResultDate = 'Pending';
                              
                              // For test_given_at - DIRECT ACCESS
                              try {
                                // Always use type assertion for safe access
                                if ((test as any).test_given_at) {
                                  // Extract date part by splitting at T
                                  const dateValue = String((test as any).test_given_at).split('T')[0];
                                  formattedTestDate = dateValue || 'Not recorded';
                                  console.log('Using test_given_at value:', (test as any).test_given_at, formattedTestDate);
                                }
                                
                                // For result_updated_at - DIRECT ACCESS
                                if ((test as any).result_updated_at) {
                                  // Extract date part by splitting at T
                                  const dateValue = String((test as any).result_updated_at).split('T')[0];
                                  formattedResultDate = dateValue || 'Pending';
                                  console.log('Using result_updated_at value:', (test as any).result_updated_at, formattedResultDate);
                                }
                              } catch (e) {
                                console.error('Error extracting dates:', e);
                              }
                              
                              // Create tooltips with full datetime - also using type assertion
                              const testDateTooltip = (test as any).test_given_at || 'Not recorded';
                              const resultDateTooltip = (test as any).result_updated_at || 'Pending';
                              
                              // Normalize the status field for display
                              let testStatus = (test.status || 'pending').toLowerCase();
                              let statusClass = '';
                              
                              // Determine the status display class
                              switch (testStatus) {
                                case 'normal':
                                  statusClass = 'bg-green-100 text-green-800';
                                  break;
                                case 'abnormal':
                                  statusClass = 'bg-yellow-100 text-yellow-800';
                                  break;
                                case 'critical':
                                  statusClass = 'bg-red-100 text-red-800';
                                  break;
                                case 'pending':
                                  statusClass = 'bg-gray-100 text-gray-800';
                                  break;
                                case 'completed':
                                  statusClass = 'bg-blue-100 text-blue-800';
                                  break;
                                default:
                                  statusClass = 'bg-gray-100 text-gray-800';
                              }
                              
                              return (
                                <tr key={`lab-test-${id}`} className="border-b last:border-b-0 hover:bg-gray-50">
                                  <td className="p-2 text-gray-500">{id}</td>
                                  <td className="p-2 font-medium">{testName}</td>
                                  <td className="p-2">{testResult}</td>
                                  <td className="p-2 text-gray-600 text-sm">{testRange}</td>
                                  <td className="p-2">
                                    <span className={`px-2 py-1 rounded-full text-xs ${statusClass}`}>
                                      {testStatus}
                                    </span>
                                  </td>
                                  <td className="p-2 text-gray-600 text-sm" title={testDateTooltip}>
                                    {formattedTestDate || 'Not recorded'}
                                  </td>
                                  <td className="p-2 text-gray-600 text-sm" title={resultDateTooltip}>
                                    {formattedResultDate || 'Pending'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Add a new helper function to format and render error messages with troubleshooting steps
  const formatErrorMessage = (errorMsg: string) => {
    // Network connectivity errors
    if (errorMsg.includes('Network error:')) {
      const troubleshooting = [
        "1. Check if the backend server is running",
        "2. Verify the server is running on port 8082",
        "3. Check if there are any firewall rules blocking the connection",
        "4. Make sure your network connection is stable"
      ];
      
      return (
        <div>
          <p className="font-medium text-red-600 mb-2">{errorMsg}</p>
          <p className="text-sm mb-1 font-medium">Troubleshooting steps:</p>
          <ul className="text-sm list-disc pl-5">
            {troubleshooting.map((step, i) => (
              <li key={i} className="mb-1">{step}</li>
            ))}
          </ul>
        </div>
      );
    }
    
    // Server configuration issues
    if (errorMsg.includes('Server configuration issue:')) {
      return (
        <div>
          <p className="font-medium text-red-600 mb-2">{errorMsg}</p>
          <p className="text-sm mb-1">This is a backend configuration problem. Please contact the administrator.</p>
        </div>
      );
    }
    
    // No lab tests found
    if (errorMsg.includes('No lab tests found')) {
      return (
        <div>
          <p className="font-medium text-amber-600">{errorMsg}</p>
          <p className="text-sm mt-1">This patient may not have any lab tests ordered for this visit.</p>
        </div>
      );
    }
    
    // Default error rendering
    return <p className="text-red-600">{errorMsg}</p>;
  };

  // Add a function to refresh patient data
  const handleRefreshPatientData = async () => {
    if (!currentPatient || !currentPatient.patientId) return;
    
    try {
      setRefreshingData(true);
      const patientId = currentPatient.patientId.toString();
      const refreshedPatient = await refreshPatientDetails(patientId);
      setCurrentPatient(refreshedPatient);
      showFeedbackMessage('Patient data refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing patient data:', error);
      showFeedbackMessage('Failed to refresh patient data', 'error');
    } finally {
      setRefreshingData(false);
    }
  };

  // Add a function to fix temperature data
  const handleFixTemperature = async () => {
    try {
      const result = await fixTemperatureData();
      showFeedbackMessage(result, 'success');
      
      // Refresh patient data after fixing temperature
      if (currentPatient && currentPatient.patientId) {
        handleRefreshPatientData();
      }
    } catch (error) {
      console.error('Error fixing temperature data:', error);
      showFeedbackMessage('Failed to fix temperature data', 'error');
    }
  };

  if (!currentPatient) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        Select a patient to view details
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Patient Header Information */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-6">
          {currentPatient.photo ? (
            <img
              src={currentPatient.photo}
              alt={currentPatient.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center overflow-hidden">
              <img 
                src="https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png" 
                alt="Default profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initial if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '';
                  target.parentElement!.innerHTML = `<span class="text-blue-500 text-2xl font-medium">${currentPatient.name.charAt(0)}</span>`;
                }}
              />
            </div>
          )}
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">{currentPatient.name}</h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-gray-600">
                    <User className="w-4 h-4 inline mr-1" /> {currentPatient.age} yrs, {currentPatient.gender}
                  </span>
                  <span className="text-gray-600">
                    <Clock className="w-4 h-4 inline mr-1" /> {currentPatient.visitTime}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm ${
            currentPatient.status === 'Active' ? 'bg-blue-100 text-blue-800' :
            currentPatient.status === 'Critical' ? 'bg-red-100 text-red-800' :
            'bg-green-100 text-green-800'
          }`}>
            {currentPatient.status}
          </span>
          {onClose && (
            <button 
              onClick={onClose} 
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close patient details"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Patient Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
        <div>
          <p className="text-sm text-gray-500">Reg. No</p>
          <p className="font-medium">{currentPatient.regNo}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">OP No</p>
          <p className="font-medium">{currentPatient.opNo}</p>
        </div>
        <div 
          className="cursor-pointer hover:text-blue-600" 
          onClick={() => setShowVisitHistory(!showVisitHistory)}
        >
          <p className="text-sm text-gray-500">Total Visits</p>
          <p className="font-medium flex items-center gap-1">
            {currentPatient.totalVisits || currentPatient.visits || 0}
            {showVisitHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Last Visit</p>
          <p className="font-medium">{getLastVisitDate()}</p>
        </div>
      </div>

      {/* Visit History Dropdown */}
      {showVisitHistory && (
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Visit History</h3>
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-lg font-medium focus:outline-none transition-colors ${activeVisitTab === 'history' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}
                  onClick={() => setActiveVisitTab('history')}
                >
                  Visit History
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium focus:outline-none transition-colors ${activeVisitTab === 'vitals' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}
                  onClick={() => setActiveVisitTab('vitals')}
                >
                  Vitals Graphs
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium focus:outline-none transition-colors ${activeVisitTab === 'labtests' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}
                  onClick={() => setActiveVisitTab('labtests')}
                >
                  Lab Tests
                </button>
              </div>
            </div>
            {/* Tab Content */}
            {activeVisitTab === 'history' && (
              <>{renderVisitHistory()}</>
            )}
            {activeVisitTab === 'labtests' && (
              <div>
                {/* Show all lab tests for all visits in a table, similar to expanded visit */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-2 font-medium text-gray-700">Visit Date</th>
                        <th className="text-left p-2 font-medium text-gray-700">Test ID</th>
                        <th className="text-left p-2 font-medium text-gray-700">Test Name</th>
                        <th className="text-left p-2 font-medium text-gray-700">Result</th>
                        <th className="text-left p-2 font-medium text-gray-700">Reference Range</th>
                        <th className="text-left p-2 font-medium text-gray-700">Status</th>
                        <th className="text-left p-2 font-medium text-gray-700">Test Date</th>
                        <th className="text-left p-2 font-medium text-gray-700">Results Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const allLabTests = visits.flatMap((visit) =>
                          (visit.labtests || []).map((test, index) => ({ visit, test, index }))
                        );
                        if (allLabTests.length === 0) {
                          return (
                            <tr>
                              <td className="p-2 text-center text-gray-400" colSpan={8}>--</td>
                            </tr>
                          );
                        }
                        return allLabTests.map(({ visit, test, index }) => {
                          const id = (test as any).testId || (test as any).test_id || index;
                          const testName = (test as any).testName || (test as any).test_name || test.name || '--';
                          const testResult = test.result || '--';
                          const testRange = test.referenceRange || test.reference_range || '--';
                          const testDate = (test as any).testGivenAt || (test as any).test_given_at || '--';
                          const resultDate = (test as any).resultUpdatedAt || (test as any).result_updated_at || '--';
                          let formattedTestDate = '--';
                          let formattedResultDate = '--';
                          try {
                            if ((test as any).test_given_at) {
                              const dateValue = String((test as any).test_given_at).split('T')[0];
                              formattedTestDate = dateValue || '--';
                            }
                            if ((test as any).result_updated_at) {
                              const dateValue = String((test as any).result_updated_at).split('T')[0];
                              formattedResultDate = dateValue || '--';
                            }
                          } catch (e) {}
                          let testStatus = (test.status || '--').toLowerCase();
                          let statusClass = '';
                          switch (testStatus) {
                            case 'normal': statusClass = 'bg-green-100 text-green-800'; break;
                            case 'abnormal': statusClass = 'bg-yellow-100 text-yellow-800'; break;
                            case 'critical': statusClass = 'bg-red-100 text-red-800'; break;
                            case 'pending': statusClass = 'bg-gray-100 text-gray-800'; break;
                            case 'completed': statusClass = 'bg-blue-100 text-blue-800'; break;
                            default: statusClass = 'bg-gray-100 text-gray-800';
                          }
                          return (
                            <tr key={`lab-test-${visit.visitId}-${id}`} className="border-b last:border-b-0 hover:bg-gray-50">
                              <td className="p-2 text-gray-500">{visit.visitDate || '--'}</td>
                              <td className="p-2 text-gray-500">{id || '--'}</td>
                              <td className="p-2 font-medium">{testName}</td>
                              <td className="p-2">{testResult}</td>
                              <td className="p-2 text-gray-600 text-sm">{testRange}</td>
                              <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs ${statusClass}`}>{testStatus || '--'}</span></td>
                              <td className="p-2 text-gray-600 text-sm">{formattedTestDate}</td>
                              <td className="p-2 text-gray-600 text-sm">{formattedResultDate}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeVisitTab === 'vitals' && (
              <div className="bg-white rounded-lg p-4">
                <div className="flex gap-6 border-b mb-4">
                  <button
                    className={`pb-2 px-2 border-b-2 font-medium ${activeVitalsTab === 'bp' ? 'border-blue-500 text-blue-700' : 'border-transparent text-gray-500'}`}
                    onClick={() => setActiveVitalsTab('bp')}
                  >
                    Blood Pressure
                  </button>
                  <button
                    className={`pb-2 px-2 border-b-2 font-medium ${activeVitalsTab === 'weight' ? 'border-blue-500 text-blue-700' : 'border-transparent text-gray-500'}`}
                    onClick={() => setActiveVitalsTab('weight')}
                  >
                    Weight
                  </button>
                  <button
                    className={`pb-2 px-2 border-b-2 font-medium ${activeVitalsTab === 'temperature' ? 'border-blue-500 text-blue-700' : 'border-transparent text-gray-500'}`}
                    onClick={() => setActiveVitalsTab('temperature')}
                  >
                    Temperature
                  </button>
                </div>
                {/* Chart Area */}
                {activeVitalsTab === 'bp' && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={visits.map(v => ({
                      date: v.visitDate,
                      systolic: v.bp ? Number((v.bp + '').split('/')[0]) : null,
                      diastolic: v.bp ? Number((v.bp + '').split('/')[1]) : null,
                    }))} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [`${name === 'systolic' ? 'Systolic' : 'Diastolic'} : ${value}`, name === 'systolic' ? 'Systolic' : 'Diastolic']} />
                      <Legend formatter={v => v === 'systolic' ? <span style={{color:'#2563eb'}}>Systolic</span> : <span style={{color:'#a21caf'}}>Diastolic</span>} />
                      <Line type="monotone" dataKey="systolic" stroke="#2563eb" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="diastolic" stroke="#a21caf" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {activeVitalsTab === 'weight' && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={visits.map(v => ({
                      date: v.visitDate,
                      weight: v.weight ? Number(v.weight) : null,
                    }))} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="weight" stroke="#2563eb" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {activeVitalsTab === 'temperature' && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={visits.map(v => ({
                      date: v.visitDate,
                      temperature: v.temperature ? Number(v.temperature) : null,
                    }))} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="temperature" stroke="#2563eb" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Visit Vitals */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Blood Pressure</span>
          </div>
          <p className="text-xl font-semibold mt-1">{currentPatient.bp || 'N/A'}</p>
        </div>
        <div className="flex-1 bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Weight</span>
          </div>
          <p className="text-xl font-semibold mt-1">{currentPatient.weight || 'N/A'}</p>
        </div>
        <div className="flex-1 bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">Temperature</span>
          </div>
          <p className="text-xl font-semibold mt-1">{currentPatient.temperature || 'N/A'}</p>
        </div>
      </div>

      {/* Current Complaint */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Current Complaint</h3>
        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
          {currentPatient.complaints || 'No current complaints recorded'}
        </p>
      </div>

      {/* Symptoms */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Symptoms</h3>
        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
          {currentPatient.symptoms || 'No symptoms recorded'}
        </p>
      </div>

      {/* Prescription Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Prescription</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setPrescriptionInputMethod('text')}
              className={`p-2 rounded ${prescriptionInputMethod === 'text' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
              title="Text Input"
            >
              <FileText className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPrescriptionInputMethod('voice')}
              className={`p-2 rounded ${prescriptionInputMethod === 'voice' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
              title="Voice Input"
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPrescriptionInputMethod('manual')}
              className={`p-2 rounded ${prescriptionInputMethod === 'manual' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
              title="Manual Input"
            >
              <PenTool className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {prescriptionInputMethod === 'text' && (
            <>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setShowTestDropdown(!showTestDropdown)}
                  className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-100"
                >
                  <TestTube className="w-4 h-4" />
                  <span>Add Lab Tests</span>
                  </button>
                  
                  {selectedLabTests.length > 0 && (
                    <div className="text-sm text-gray-600">
                      {selectedLabTests.length} test{selectedLabTests.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
              </div>
              
              {/* Dropdown menu for lab test categories */}
              {showTestDropdown && (
                <div className="mt-2 p-4 bg-white border rounded-lg shadow-md">
                  <div className="mb-3">
                    <div className="flex flex-col gap-2 mb-3">
                      <label className="block text-sm font-medium text-gray-700">Search Tests</label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search lab tests..."
                        className="w-full p-2 border rounded-md"
                      />
                  </div>
                  
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Categories</label>
                    <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="All">All Categories</option>
                      {labTestCategories.map(category => {
                        const testsInCategory = commonLabTests.filter(test => test.category === category);
                        const selectedCount = testsInCategory.filter(test => test.id && selectedLabTests.includes(test.id)).length;
                        return (
                          <option key={category} value={category}>
                            {category} {selectedCount > 0 ? `(${selectedCount} selected)` : ''}
                          </option>
                        );
                      })}
                    </select>
                      </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2">
                    {commonLabTests
                      .filter(test => {
                        // Filter by category
                        const categoryMatch = selectedCategory === 'All' || test.category === selectedCategory;
                        
                        // Filter by search query
                        const searchMatch = !searchQuery || 
                          (test.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           test.testName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           test.category?.toLowerCase().includes(searchQuery.toLowerCase()));
                        
                        return categoryMatch && searchMatch;
                      })
                      .map(test => (
                        <div 
                          key={test.id}
                        onClick={() => test.id && handleLabTestSelect(test.id)}
                          className={`p-2 border rounded-md cursor-pointer flex items-center gap-2 text-sm ${
                          test.id && selectedLabTests.includes(test.id)
                              ? 'bg-blue-50 border-blue-300' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            test.id && selectedLabTests.includes(test.id) 
                              ? 'bg-blue-500 text-white' 
                              : 'border border-gray-300'
                        }`}>
                          {test.id && selectedLabTests.includes(test.id) && <Check className="w-3 h-3" />}
                        </div>
                          <span className="truncate">{test.name}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {selectedLabTests.length > 0 && (
                        <span>{selectedLabTests.length} test{selectedLabTests.length !== 1 ? 's' : ''} selected</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedLabTests([]);
                          setSearchQuery('');
                        }}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setShowTestDropdown(false)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Display selected lab tests above the prescription text box */}
              {selectedLabTests.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                  <h5 className="text-sm font-medium text-blue-700 mb-2">Selected Lab Tests:</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedLabTests.map(testId => {
                      const test = commonLabTests.find(t => t.id === testId);
                      return (
                        <div key={testId || ''} className="bg-white px-2 py-1 rounded border border-blue-300 text-sm flex items-center gap-1">
                          <span>{test?.name || test?.testName || ''}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLabTestSelect(testId);
                            }} 
                            className="text-blue-500 hover:text-blue-700"
                            title={`Remove ${test?.name || test?.testName || 'test'}`}
                            aria-label={`Remove ${test?.name || test?.testName || 'test'}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    These tests will be saved separately from your typed prescription
                  </p>
                </div>
              )}
              
              <textarea
                value={prescriptionText}
                onChange={(e) => setPrescriptionText(e.target.value)}
                placeholder={selectedLabTests.length > 0 
                  ? "Enter prescription here. Lab tests are already selected above and will be saved separately." 
                  : "Enter prescription details..."}
                className={`w-full h-48 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedLabTests.length > 0 ? 'border-t-0 rounded-t-none' : ''
                }`}
              />
            </>
          )}

          {prescriptionInputMethod === 'voice' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {isListening && (
                    <div className="flex items-center mr-3 space-x-1">
                      <div className="w-2 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-6 bg-red-500 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-3 bg-red-500 rounded-full animate-pulse delay-150"></div>
                    </div>
                  )}
                  <span className={`font-medium ${isListening ? 'text-red-500' : 'text-gray-700'}`}>
                    {isListening ? 'Recording active - speak clearly' : 'Voice Input Mode'}
                  </span>
                </div>
                <button
                  onClick={() => toggleVoiceRecognition('prescription')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    isListening
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isListening ? (
                    <>
                      <X className="w-4 h-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Start Recording
                    </>
                  )}
                </button>
              </div>
              
              <textarea
                value={prescriptionText}
                onChange={(e) => setPrescriptionText(e.target.value)}
                placeholder={isListening ? "Speaking... text will appear here" : "Start recording or type prescription details..."}
                className={`w-full h-36 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isListening ? 'border-red-300 bg-red-50' : ''
                }`}
              />
              
              <div className="text-sm text-gray-500">
                {isListening ? 
                  "Speak clearly. Your speech will appear in the text box. You can manually edit the text at any time." : 
                  "Click 'Start Recording' to use voice input or type directly in the box."
                }
              </div>
            </div>
          )}

          {prescriptionInputMethod === 'manual' && (
            <div className="bg-gray-50 h-48 rounded-lg p-4">
              <canvas
                className="w-full h-full border-2 border-dashed border-gray-300 rounded"
              />
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Notes</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setNotesInputMethod('text')}
              className={`p-2 rounded ${notesInputMethod === 'text' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
              title="Text Input"
            >
              <FileText className="w-5 h-5" />
            </button>
            <button
              onClick={() => setNotesInputMethod('voice')}
              className={`p-2 rounded ${notesInputMethod === 'voice' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
              title="Voice Input"
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={() => setNotesInputMethod('manual')}
              className={`p-2 rounded ${notesInputMethod === 'manual' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
              title="Manual Input"
            >
              <PenTool className="w-5 h-5" />
            </button>
          </div>
        </div>

        {notesInputMethod === 'text' && (
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Enter notes..."
            className="w-full h-48 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        {notesInputMethod === 'voice' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {isListening && (
                  <div className="flex items-center mr-3 space-x-1">
                    <div className="w-2 h-4 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-6 bg-red-500 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-3 bg-red-500 rounded-full animate-pulse delay-150"></div>
                  </div>
                )}
                <span className={`font-medium ${isListening ? 'text-red-500' : 'text-gray-700'}`}>
                  {isListening ? 'Recording...' : 'Voice Input Mode'}
                </span>
              </div>
              <button
                onClick={() => toggleVoiceRecognition('notes')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isListening
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isListening ? (
                  <>
                    <X className="w-4 h-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Start Recording
                  </>
                )}
              </button>
            </div>
            
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder={isListening ? "Speaking... text will appear here" : "Start recording or type notes..."}
              className={`w-full h-36 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isListening ? 'border-red-300 bg-red-50' : ''
              }`}
            />
            
            <div className="text-sm text-gray-500">
              {isListening ? 
                "Speak clearly. You can manually edit the text as needed." : 
                "Click 'Start Recording' to use voice input."
              }
            </div>
          </div>
        )}

        {notesInputMethod === 'manual' && (
          <div className="bg-gray-50 h-48 rounded-lg p-4">
            <canvas
              className="w-full h-full border-2 border-dashed border-gray-300 rounded"
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {showFeedback && (
          <div 
            className={`flex items-center px-4 py-2 rounded-lg ${
              feedbackType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {feedbackType === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {feedbackMessage}
          </div>
        )}
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Print Details
        </button>
        <button 
          onClick={handleSavePrescription}
          disabled={savingPrescription}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
            savingPrescription 
              ? 'bg-blue-300 text-white cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {savingPrescription ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Prescription
            </>
          )}
        </button>
      </div>
    </div>
  );
}