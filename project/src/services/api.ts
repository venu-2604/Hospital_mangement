const API_BASE_URL = 'http://localhost:8082';

import { Patient, Visit, LabTest, DoctorAuth } from '../types';

// Define ApiResponse type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Patient API endpoints
export const fetchPatients = async (): Promise<Patient[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/patients`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
};

export const fetchPatientsByCategory = async (category: string): Promise<Patient[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/patients/category/${category}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${category} patients:`, error);
    throw error;
  }
};

export const fetchPatientById = async (patientId: string): Promise<Patient> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching patient details:', error);
    throw error;
  }
};

export const refreshPatientDetails = async (patientId: string): Promise<Patient> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}/refresh`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error refreshing patient details:', error);
    throw error;
  }
};

export const fixTemperatureData = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/patients/fixTemperature`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fixing temperature data:', error);
    throw error;
  }
};

export const registerPatient = async (patientData: any): Promise<{patient: Patient, isNewPatient: boolean, message: string}> => {
  try {
    console.log('Registering patient with data:', patientData);
    const response = await fetch(`${API_BASE_URL}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Try to extract meaningful error message from response if available
      let errorMessage = 'Failed to register patient';
      
      if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      } else if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        // Handle validation errors array
        errorMessage = data.errors.map((err: any) => err.defaultMessage || err.message).join(', ');
      } else {
        errorMessage = `HTTP error! Status: ${response.status}`;
      }
      
      // Check for specific error patterns in the message
      if (response.status === 500 && errorMessage.includes('duplicate key value')) {
        if (errorMessage.includes('aadhar_number')) {
          errorMessage = 'A patient with this Aadhar number already exists. Please verify the information.';
        }
      }
      
      console.error('Server returned error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    console.log('Patient registration response:', data);
    return data;
  } catch (error) {
    console.error('Error registering patient:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Could not connect to the server. Please check if the backend is running.');
    }
    throw error;
  }
};

export const updatePatient = async (patientId: string, patientData: Patient): Promise<Patient> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/patients/${patientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

// Enhanced searchPatients with client-side filtering for better responsiveness
export const searchPatients = async (query: string, patientList?: Patient[]): Promise<Patient[]> => {
  try {
    // If we already have a patient list, perform client-side filtering first for immediate feedback
    if (patientList && patientList.length > 0) {
      const normalizedQuery = query.toLowerCase().trim();
      
      // Perform client-side filtering by name, complaint, and date
      const filteredPatients = patientList.filter(patient => {
        // Check if patient name matches
        const nameMatch = patient.name?.toLowerCase().includes(normalizedQuery);
        
        // Check if complaint matches
        const complaintMatch = patient.complaints?.toLowerCase().includes(normalizedQuery);
        
        // Check if date matches (visitDate could be in different formats)
        let dateMatch = false;
        if (patient.visitDate) {
          try {
            const visitDate = new Date(patient.visitDate);
            const formattedDate = visitDate.toLocaleDateString();
            dateMatch = formattedDate.includes(normalizedQuery);
          } catch (e) {
            // If date parsing fails, just continue
          }
        }
        
        // Return true if any field matches
        return nameMatch || complaintMatch || dateMatch;
      });
      
      console.log(`Client-side search for "${query}" found ${filteredPatients.length} matches`);
      return filteredPatients;
    }
    
    // If no patient list is provided or client-side filtering returned no results, fallback to API
    const response = await fetch(`${API_BASE_URL}/api/patients/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error searching patients:', error);
    throw error;
  }
};

// Visit API endpoints
export const fetchVisitsByPatientId = async (patientId: string): Promise<Visit[]> => {
  try {
    console.log(`Fetching visits for patient ${patientId}`);
    const response = await fetch(`${API_BASE_URL}/api/visits/patient/${patientId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const visits = await response.json();
    console.log('Visits retrieved:', visits);
    
    // Now that we know the labtests table exists and has data,
    // let's fetch lab tests for each visit
    const visitsWithLabTests = await Promise.all(
      visits.map(async (visit: Visit) => {
        if (visit.visitId) {
          const visitIdString = visit.visitId.toString();
          console.log(`Processing visit ${visitIdString} for patient ${patientId}`);
          
          // Check for existing lab tests in the visit object
          if (visit.labtests && Array.isArray(visit.labtests) && visit.labtests.length > 0) {
            console.log(`Visit ${visitIdString} already has lab tests attached:`, visit.labtests);
            return visit;
          }
          
          try {
            // Try to fetch lab tests for this visit - pass the patientId as well
            console.log(`Fetching lab tests for visit ${visitIdString}`);
            const labTests = await fetchLabTestsByVisitId(visit.visitId, patientId);
            
            if (labTests && labTests.length > 0) {
              console.log(`Found ${labTests.length} lab tests for visit ${visitIdString}:`, labTests);
              return {
                ...visit,
                labtests: labTests
              };
            } else {
              console.log(`No lab tests found for visit ${visitIdString}`);
            }
          } catch (error) {
            console.warn(`Error fetching lab tests for visit ${visitIdString}:`, error);
          }
        }
        
        // Return the visit as is if we couldn't attach lab tests or it already has them
        console.log(`Returning visit ${visit.visitId} without changes`);
        return visit;
      })
    );
    
    return visitsWithLabTests;
  } catch (error) {
    console.error('Error fetching visits by patient ID:', error);
    throw error;
  }
};

/**
 * Fetch visits with lab tests using the more efficient JOIN approach
 * This uses a single query with JOIN on the server side for better performance
 */
export const fetchVisitsWithLabTestsByPatientId = async (patientId: string): Promise<Visit[]> => {
  try {
    if (!patientId) {
      throw new Error("Patient ID is required");
    }
    
    console.log(`Fetching visits with lab tests for patient ${patientId}`);
    
    // Add a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/visits/patient/${patientId}/with-labtests`, 
        { signal: controller.signal }
      );
      
      // Clear the timeout
      clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`JOIN approach failed with status ${response.status}, falling back to standard approach`);
      // Fall back to the standard approach
        const visits = await fetchVisitsByPatientId(patientId);
        
        // Return visits with populated lab tests
        return visits;
    }
    
      // Process the response to ensure it has the correct property name
    const visits = await response.json();
      
      // Make sure the lab tests array has the correct property name 'labtests'
      const processedVisits = visits.map((visit: Visit) => {
        // Use type assertion to handle the potential mismatch between backend and frontend types
        const visitData = visit as any;
        if (visitData.labTests && !visitData.labtests) {
          return {
            ...visit,
            labtests: visitData.labTests
          };
        }
        return visit;
      });
      
      console.log(`Retrieved ${processedVisits.length} visits with lab tests`);
      return processedVisits;
    } catch (fetchError) {
      // Type assertion for fetchError
      const error = fetchError as any;
      if (error.name === 'AbortError') {
        console.warn('Request timed out, falling back to standard approach');
        return fetchVisitsByPatientId(patientId);
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error fetching visits with lab tests:', error);
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      console.warn('Network error, attempting standard approach');
      try {
        return await fetchVisitsByPatientId(patientId);
      } catch (fallbackError) {
        console.error('Fallback approach also failed:', fallbackError);
        throw new Error('Failed to load patient visit history. Please check your connection and try again.');
      }
    }
    throw error;
  }
};

export const createVisit = async (visitData: Visit): Promise<Visit> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating visit:', error);
    throw error;
  }
};

export const updateVisit = async (visitId: string | number, visitData: Partial<Visit>): Promise<Visit> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/visits/${visitId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating visit:', error);
    throw error;
  }
};

export const savePrescription = async (visitId: string | number, prescription: string, notes?: string, doctorId?: string): Promise<Visit> => {
  try {
    console.log('Saving prescription with doctorId:', doctorId);
    const payload: any = { prescription };
    if (notes !== undefined) payload.notes = notes;
    if (doctorId !== undefined) {
      payload.doctorId = doctorId;
      console.log('Added doctorId to payload:', payload.doctorId);
    }
    console.log('Final payload:', payload);
    return await updateVisit(visitId, payload);
  } catch (error) {
    console.error('Error saving prescription:', error);
    throw error;
  }
};

export const saveNotes = async (visitId: string | number, notes: string): Promise<Visit> => {
  try {
    console.log(`[DEBUG] Saving notes for visit ${visitId}:`, notes);
    console.log(`[DEBUG] Sending payload:`, { notes });
    
    // Use a more direct approach instead of calling updateVisit
    const response = await fetch(`${API_BASE_URL}/api/visits/${visitId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DEBUG] Error response from server:`, errorText);
      throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[DEBUG] Server response after saving notes:`, result);
    return result;
  } catch (error) {
    console.error('[DEBUG] Error saving notes:', error);
    throw error;
  }
};

// Lab Test API endpoints
export const getMockLabTests = (visitId: number | string): LabTest[] => {
  // Return an empty array instead of hardcoded data
  return [];
};

// Add a new diagnostic function to check server connectivity with detailed error reporting
export const diagnoseServerConnectivity = async (): Promise<{isConnected: boolean, details: string}> => {
  try {
    // Try a simple HEAD request to quickly check if the server is responding
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    console.log('Checking base server connectivity...');
    const response = await fetch(`${API_BASE_URL}`, { 
      method: 'HEAD',
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('Base server is reachable');
      return { isConnected: true, details: 'Server is reachable' };
    } else {
      console.warn(`Server responded with status ${response.status}`);
      return { 
        isConnected: false, 
        details: `Server responded with status ${response.status}. The server is running but may be configured incorrectly.` 
      };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        isConnected: false,
        details: 'Connection timed out. The server might be running but is responding too slowly.'
      };
    }
    
    // Check for different types of network errors
    if (error.message?.includes('Failed to fetch')) {
      if (window.navigator.onLine === false) {
        return {
          isConnected: false,
          details: 'Your browser reports that you are offline. Please check your internet connection.'
        };
      }
      
      // Try to ping a public URL to confirm internet connectivity
      try {
        const publicController = new AbortController();
        const publicTimeoutId = setTimeout(() => publicController.abort(), 3000);
        
        const googleResponse = await fetch('https://www.google.com', { 
          method: 'HEAD',
          signal: publicController.signal 
        });
        
        clearTimeout(publicTimeoutId);
        
        if (googleResponse.ok) {
          return {
            isConnected: false,
            details: 'Internet is working, but the server is unreachable. Possible causes: (1) Server is not running (2) Server is running on a different port (3) Firewall is blocking the connection'
          };
        }
      } catch {
        return {
          isConnected: false,
          details: 'Both the server and the internet appear to be unreachable. Please check your network connection.'
        };
      }
    }
    
    return {
      isConnected: false,
      details: `Connection error: ${error.message || 'Unknown error'}`
    };
  }
};

// Update the fetchLabTestsByVisitId function to use the new diagnostics
export const fetchLabTestsByVisitId = async (visitId: number | string, patientId?: string): Promise<LabTest[]> => {
  try {
    if (!visitId) {
      throw new Error("Visit ID is required to fetch lab tests");
    }
    
    console.log(`Fetching lab tests for visit ${visitId}${patientId ? ` and patient ${patientId}` : ''}`);
    
    // Try different URL variations to handle potential server configurations
    const urlVariations = [
      `${API_BASE_URL}/api/labtests/visit/${visitId}`,
      `${API_BASE_URL}/labtests/visit/${visitId}`,
      `${API_BASE_URL}/visits/${visitId}/labtests`
    ];
    
    // Add a timeout to the fetch to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let lastError: any = null;
    
    // Try each URL variation
    for (const url of urlVariations) {
      try {
        console.log(`Trying endpoint: ${url}`);
        
        const response = await fetch(url, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          // Clear the timeout if we get a successful response
          clearTimeout(timeoutId);
          
          // Parse and return the data
          const labTests = await response.json();
          console.log(`Successfully retrieved ${labTests.length} lab tests for visit ${visitId} from ${url}`);
          
          // Post-process to ensure date fields are available
          const processedTests = labTests.map((test: any) => {
            // Make deep copy to avoid reference issues
            const processedTest = { ...test };
            
            // Ensure all date fields are explicitly available
            if (processedTest.test_given_at) {
              processedTest.testGivenAt = String(processedTest.test_given_at);
              console.log(`Test ${processedTest.test_id} - Explicit test_given_at: ${processedTest.test_given_at}`);
            }
            
            if (processedTest.result_updated_at) {
              processedTest.resultUpdatedAt = String(processedTest.result_updated_at);
              console.log(`Test ${processedTest.test_id} - Explicit result_updated_at: ${processedTest.result_updated_at}`);
            }
            
            return processedTest;
          });
          
          return processedTests;
        } else {
          const errorText = `Server returned status ${response.status} for ${url}`;
          console.warn(errorText);
          lastError = new Error(errorText);
        }
      } catch (fetchError) {
        console.warn(`Error with endpoint ${url}:`, fetchError);
        lastError = fetchError;
      }
    }
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // If we have a patient ID, try an endpoint that uses that
    if (patientId) {
      try {
        const patientUrl = `${API_BASE_URL}/api/labtests/patient/${patientId}/visit/${visitId}`;
        console.log(`Trying patient-based endpoint: ${patientUrl}`);
        
        const patientResponse = await fetch(patientUrl);
        if (patientResponse.ok) {
          const data = await patientResponse.json();
          console.log(`Retrieved ${data.length} lab tests using patient ID approach`);
          return data;
        }
      } catch (patientError) {
        console.warn('Patient-based approach failed:', patientError);
      }
    }
    
    // If all approaches fail, throw the last error
    throw lastError || new Error('Failed to fetch lab tests from all attempted endpoints');
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    
    // Return a more informative error that can be displayed to the user
    if (error instanceof Error) {
      // Handle the specific "No static resource" error
      if (error.message.includes('No static resource')) {
        console.warn('Detected "No static resource" error - this indicates a URL format issue');
        // Try one more approach with a different URL format
        try {
          console.log('Attempting final fallback with direct server URL...');
          const response = await fetch(`http://localhost:8082/labtests/visit/${visitId}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Successfully retrieved ${data.length} lab tests using final fallback URL`);
            return data;
          }
        } catch (fallbackError) {
          console.error('Final fallback also failed:', fallbackError);
        }
        
        throw new Error(`Server configuration issue: The API endpoints for lab tests cannot be accessed. Please check your server configuration.`);
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        // Run diagnostics to provide a more specific error message
        try {
          const diagnostics = await diagnoseServerConnectivity();
          throw new Error(`Network error: ${diagnostics.details}`);
        } catch (diagError) {
          // If diagnostics also fail, return a more generic but still helpful message
          throw new Error(`Network error: Unable to connect to the server at ${API_BASE_URL}. Please check if the backend server is running on port 8082.`);
        }
      }
      
      throw new Error(`Could not fetch lab tests: ${error.message}`);
    }
    throw new Error('An unexpected error occurred while fetching lab tests');
  }
};

// Utility function to transform snake_case database fields to camelCase for frontend
const transformLabTestToCamelCase = (labTest: any): LabTest => {
  // Log the original data to debug date field issues
  console.log('Original lab test data from API:', {
    test_id: labTest.test_id,
    test_name: labTest.test_name,
    test_given_at: labTest.test_given_at,
    result_updated_at: labTest.result_updated_at,
    all_keys: Object.keys(labTest)
  });
  
  // Force direct string copies of date fields to ensure they're present
  const test_given_at = labTest.test_given_at ? String(labTest.test_given_at) : null;
  const result_updated_at = labTest.result_updated_at ? String(labTest.result_updated_at) : null;
  
  // Log direct access to date fields
  console.log(`Date field direct access - test ID ${labTest.test_id}:`, {
    raw_test_given_at: labTest.test_given_at,
    copied_test_given_at: test_given_at,
    raw_result_updated_at: labTest.result_updated_at,
    copied_result_updated_at: result_updated_at
  });
  
  // Create the transformed object
  const transformed = {
    // Primary camelCase fields for frontend
    testId: labTest.test_id,
    visitId: labTest.visit_id,
    patientId: labTest.patient_id,
    testName: labTest.test_name,
    result: labTest.result,
    referenceRange: labTest.reference_range,
    status: labTest.status,
    
    // Date fields - set both camelCase and snake_case versions
    testGivenAt: test_given_at,
    resultUpdatedAt: result_updated_at,
    test_given_at: test_given_at,
    result_updated_at: result_updated_at,
    
    // Keep original fields for compatibility
    ...labTest,
    
    // UI fields
    name: labTest.name || labTest.test_name,
    id: labTest.id || labTest.test_id?.toString()
  };
  
  // Log the transformed result for verification
  console.log('Transformed lab test data:', {
    testGivenAt: transformed.testGivenAt,
    test_given_at: transformed.test_given_at,
    resultUpdatedAt: transformed.resultUpdatedAt,
    result_updated_at: transformed.result_updated_at
  });
  
  return transformed;
};

// Transform camelCase frontend fields to snake_case for database
const transformLabTestToSnakeCase = (labTest: any): any => {
  return {
    test_id: labTest.testId || labTest.test_id,
    visit_id: labTest.visitId || labTest.visit_id,
    patient_id: labTest.patientId || labTest.patient_id,
    test_name: labTest.testName || labTest.test_name || labTest.name,
    result: labTest.result || '',
    reference_range: labTest.referenceRange || labTest.reference_range || 'Pending',
    status: labTest.status || 'pending',
    // Avoid sending timestamps as they're managed by the database
  };
};

// Helper function to attempt saving a single lab test with multiple endpoints and formats
const attemptSaveWithMultipleEndpoints = async (labTest: any): Promise<any> => {
  // The working endpoints, in order of preference
  const endpoints = [
    // Use direct test creation endpoint
    `${API_BASE_URL}/api/labtests`,
    // Alternative endpoint format
    `${API_BASE_URL}/labtests`,
    // Visit-specific endpoint
    `${API_BASE_URL}/api/visits/${labTest.visit_id}/labtests`
  ];
  
  // Try sending with different request body formats
  const requestBodyFormats = [
    // Format 1: Original full object format
    labTest,
    
    // Format 2: Simplified format with essential fields
    {
      test_name: labTest.test_name || labTest.name,
      visit_id: labTest.visit_id,
      patient_id: labTest.patient_id,
      reference_range: labTest.reference_range || 'Pending',
      result: labTest.result || '',
      status: labTest.status || 'pending'
    },
    
    // Format 3: Using only test_name without name
    {
      test_name: labTest.test_name || labTest.name,
      visit_id: labTest.visit_id,
      patient_id: labTest.patient_id,
      reference_range: labTest.reference_range || 'Pending',
      result: labTest.result || '',
      status: labTest.status || 'pending'
    },
    
    // Format 4: With both test_name and name fields
    {
      visit_id: labTest.visit_id,
      patient_id: labTest.patient_id,
      test_name: labTest.test_name || labTest.name,
      name: labTest.test_name || labTest.name,
      reference_range: labTest.reference_range || 'Pending',
      result: labTest.result || '',
      status: labTest.status || 'pending'
    },
    
    // Format 5: With camelCase naming instead of snake_case
    {
      visitId: labTest.visit_id,
      patientId: labTest.patient_id,
      testName: labTest.test_name || labTest.name,
      referenceRange: labTest.reference_range || 'Pending',
      result: labTest.result || '',
      status: labTest.status || 'pending'
    }
  ];
  
  // Try each endpoint with each format
  for (const endpoint of endpoints) {
    for (const [index, requestBody] of requestBodyFormats.entries()) {
      try {
        console.log(`Trying to save lab test to endpoint: ${endpoint} with format ${index + 1}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'omit',
          body: JSON.stringify(requestBody),
        });
        
        // Try to capture and log the response
        let responseText = '';
        let responseData = null;
        
        try {
          responseText = await response.text();
          try {
            responseData = JSON.parse(responseText);
          } catch (parseError) {
            // Not JSON, keep as text
          }
        } catch (readError) {
          responseText = 'Could not read response body';
        }
        
        if (response.ok) {
          console.log(`Successfully saved lab test to ${endpoint} with format ${index + 1}`);
          // Return the result, transforming if needed
          return responseData ? transformLabTestToCamelCase(responseData) : {
            testId: Math.random().toString().substr(2, 8), // Fallback ID
            visitId: labTest.visit_id,
            patientId: labTest.patient_id,
            name: labTest.name,
            testName: labTest.name,
            success: true
          };
        }
        
        console.log(`Endpoint ${endpoint} with format ${index + 1} failed with status ${response.status}`);
      } catch (error) {
        console.error(`Error with endpoint ${endpoint} format ${index + 1}:`, error);
      }
    }
  }
  
  // If we get here, all endpoints failed
  throw new Error(`Failed to save lab test ${labTest.name} after trying all endpoints and formats`);
};

export async function addLabTest(labTest: LabTest, visitId: any): Promise<ApiResponse<any>> {
  try {
    console.log('Adding lab test:', labTest, 'to visit:', visitId);
    
    // Convert visitId to number to ensure consistent typing
    const numericVisitId = Number(visitId);
    if (isNaN(numericVisitId)) {
      console.error(`Invalid visit ID: ${visitId} - must be numeric`);
      throw new Error(`Invalid visit ID: ${visitId} - must be numeric`);
    }
    
    // Format the lab test correctly for the API
    const formattedLabTest = {
      ...labTest,
      visit_id: numericVisitId,
      // Use test_name field for the database as specified in types.ts
      test_name: labTest.testName || labTest.name || '', 
      // Include both fields for maximum compatibility
      name: labTest.testName || labTest.name || '',
      reference_range: labTest.referenceRange || 'Pending',
      result: labTest.result || '',
      status: labTest.status || 'pending'
    };
    
    console.log('Formatted lab test for database:', formattedLabTest);
    
    // Use the helper function to try multiple endpoints and formats
    return await attemptSaveWithMultipleEndpoints(formattedLabTest);
  } catch (error) {
    console.error('Error adding lab test:', error);
    throw error;
  }
}

// Save multiple lab tests for a visit
export const saveLabTests = async (visitId: string | number, labTests: any[], patientId?: string): Promise<LabTest[]> => {
  try {
    // Convert visitId to a number to ensure consistent format
    const numericVisitId = Number(visitId);
    
    if (isNaN(numericVisitId)) {
      throw new Error(`Invalid visit ID: ${visitId} - must be numeric`);
    }
    
    // Input validation
    if (!labTests || !Array.isArray(labTests) || labTests.length === 0) {
      console.warn('No lab tests provided to saveLabTests function');
      return [];
    }
    
    console.log('Starting saveLabTests with:', { 
      visitId: numericVisitId, 
      labTestsCount: labTests.length, 
      patientId,
      firstTestName: labTests[0]?.name || labTests[0]?.testName || 'unknown'
    });
    
    // Transform each lab test from camelCase to snake_case for database
    const formattedLabTests = labTests.map(test => {
      // First ensure consistent camelCase format
      const camelCaseTest = {
        visitId: numericVisitId,
        patientId: patientId || test.patientId || test.patient_id || '',
        testName: test.testName || test.test_name || test.name || '',
        referenceRange: test.referenceRange || test.reference_range || 'Pending',
        result: test.result || '',
        status: test.status || 'pending',
      };
      
      // Then transform to snake_case for database 
      return {
        visit_id: numericVisitId,
        patient_id: patientId || test.patientId || test.patient_id || '',
        // Use test_name as the primary field for the database per types.ts
        test_name: camelCaseTest.testName,
        // Include name field as backup for compatibility
        name: camelCaseTest.testName,
        reference_range: camelCaseTest.referenceRange,
        result: camelCaseTest.result || '',
        status: camelCaseTest.status || 'pending'
      };
    });

    console.log('Formatted lab tests for API:', formattedLabTests);
    
    // Try both batch and individual approaches to maximize success chance
    
    // APPROACH 1: Try batch endpoints first with retry logic
    console.log('APPROACH 1: Attempting batch save with retry logic');
    const batchEndpoints = [
      `${API_BASE_URL}/api/labtests/batch`,
      `${API_BASE_URL}/labtests/batch`,
      `${API_BASE_URL}/api/visits/${numericVisitId}/labtests/batch`
    ];
    
    // Try each batch endpoint with different request formats
    const batchFormats = [
      // Format 1: Array of lab tests with test_name field
      formattedLabTests,
      
      // Format 2: Wrapped in an object 
      { 
        tests: formattedLabTests 
      },
      
      // Format 3: With visitId in wrapper
      { 
        visitId: numericVisitId, 
        tests: formattedLabTests
      },
      
      // Format 4: With metadata
      { 
        visitId: numericVisitId, 
        patientId: patientId || formattedLabTests[0]?.patient_id, 
        tests: formattedLabTests,
        timestamp: new Date().toISOString()
      }
    ];
    
    // Try each batch endpoint with each format
    for (const endpoint of batchEndpoints) {
      for (const [formatIndex, requestBody] of batchFormats.entries()) {
        try {
          console.log(`Trying batch endpoint: ${endpoint} with format ${formatIndex + 1}`);
          console.log('Request body:', JSON.stringify(requestBody));
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            credentials: 'omit',
            body: JSON.stringify(requestBody),
          });
          
          let responseData;
          let responseText = '';
          
          try {
            responseText = await response.text();
            try {
              responseData = JSON.parse(responseText);
            } catch (parseError) {
              console.warn('Response is not JSON:', responseText);
            }
          } catch (responseError) {
            console.error('Could not read response:', responseError);
          }
          
          console.log(`Batch endpoint ${endpoint} response: Status ${response.status}`, responseData || responseText);
          
          if (response.ok) {
            console.log('Batch save successful');
            
            if (responseData && responseData.created && Array.isArray(responseData.created)) {
              // Transform all created tests to camelCase
              return responseData.created.map(transformLabTestToCamelCase);
            } else if (Array.isArray(responseData)) {
              // Response is directly the array of created tests
              return responseData.map(transformLabTestToCamelCase);
            }
            
            // If no data was returned but request was successful, use original data
            return formattedLabTests.map(transformLabTestToCamelCase);
          }
        } catch (batchError) {
          console.error(`Error with batch endpoint ${endpoint} format ${formatIndex + 1}:`, batchError);
        }
      }
    }
    
    console.warn('All batch endpoints failed. Falling back to individual saves...');
    
    // APPROACH 2: Individual saves with retry logic
    console.log('APPROACH 2: Attempting individual saves with retry logic');
    const results: LabTest[] = [];
    let successCount = 0;
    let failureCount = 0;
    
    // Maximum attempts per lab test
    const MAX_ATTEMPTS = 5;
    
    for (const labTest of formattedLabTests) {
      let saved = false;
      let attempts = 0;
      
      // Keep retrying until success or max attempts reached
      while (!saved && attempts < MAX_ATTEMPTS) {
        attempts++;
        try {
          console.log(`Attempting to save lab test "${labTest.name}" (Attempt ${attempts}/${MAX_ATTEMPTS})`);
          
          const savedTest = await attemptSaveWithMultipleEndpoints(labTest);
          if (savedTest) {
            console.log(`Successfully saved lab test "${labTest.name}" on attempt ${attempts}`);
            results.push(savedTest);
            successCount++;
            saved = true;
          }
        } catch (error) {
          console.error(`Attempt ${attempts} failed for lab test "${labTest.name}":`, error);
          
          // Short delay before retry to avoid overwhelming the server
          if (attempts < MAX_ATTEMPTS) {
            const delay = Math.min(500 * attempts, 2000); // Exponential backoff with max 2 seconds
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      if (!saved) {
        failureCount++;
        console.error(`Failed to save lab test "${labTest.name}" after ${MAX_ATTEMPTS} attempts`);
      }
    }
    
    console.log(`Completed saving ${successCount}/${formattedLabTests.length} lab tests (${failureCount} failures)`);
    
    // Return the successful results
    return results;
  } catch (error) {
    console.error('Error in saveLabTests:', error);
    throw error;
  }
};

// Health check API
export const checkHealth = async (): Promise<boolean> => {
  try {
    // Create an AbortController with timeout functionality
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_BASE_URL}/api/health`, { 
      signal: controller.signal 
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`API health check failed: ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    console.log('API health check:', data);
    return data.status === 'UP';
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('API health check timed out after 5 seconds');
    } else {
      console.error('API health check error:', error);
    }
    return false;
  }
};

export const debugLabTestsSchema = async (): Promise<any> => {
  try {
    console.log('Checking lab tests database schema');
    
    // Try the correct table name first
    console.log('Trying /api/labtests endpoint first');
    const response = await fetch(`${API_BASE_URL}/api/labtests/debug/schema`);
    
    if (!response.ok) {
      console.warn(`Labtests schema check failed, trying alternate format`);
      // Try the alternate format
      const altResponse = await fetch(`${API_BASE_URL}/labtests/debug/schema`);
      
      if (!altResponse.ok) {
        throw new Error(`HTTP error! All schema checks failed`);
      }
      
      const data = await altResponse.json();
      console.log('Lab tests schema info (alternate format):', data);
      return data;
    }
    
    const data = await response.json();
    console.log('Lab tests schema info:', data);
    return data;
  } catch (error) {
    console.error('Error checking lab tests schema:', error);
    return {
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      table_name: 'labtests',
      error_source: 'frontend'
    };
  }
};

export const debugLabTestEndpoints = async (visitId: string | number): Promise<any> => {
  try {
    console.log('Debugging lab test endpoints for visit ID:', visitId);
    const results: Record<string, any> = {};
    
    // Try all known endpoint formats - prioritize the correct table name
    const endpoints = [
      // First try the standard API pattern
      `${API_BASE_URL}/api/labtests/visit/${visitId}`,
      `${API_BASE_URL}/api/labtests/direct/visit/${visitId}`,
      // Then alternatives
      `${API_BASE_URL}/labtests/visit/${visitId}`,
      `${API_BASE_URL}/labtests/direct/visit/${visitId}`,
      `${API_BASE_URL}/api/visits/${visitId}/labtests`
    ];
    
    for (const url of endpoints) {
      try {
        console.log(`Testing endpoint: ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const status = response.status;
        let data = null;
        
        try {
          data = await response.json();
        } catch (e) {
          data = { error: 'Failed to parse JSON response' };
        }
        
        results[url] = { status, data };
        console.log(`Endpoint ${url} returned status ${status} with data:`, data);
      } catch (error) {
        results[url] = { 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        };
        console.error(`Error testing endpoint ${url}:`, error);
      }
    }
    
    return {
      visitId,
      timestamp: new Date().toISOString(),
      results
    };
  } catch (error) {
    console.error('Error in debugLabTestEndpoints:', error);
    return {
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Simple diagnostic function to check LabTest database status
export const checkLabTestDatabaseStatus = async (): Promise<any> => {
  try {
    console.log('Checking lab test database status');
    
    // Try the correct table name first
    console.log('Trying /api/labtests/debug/schema endpoint');
    const schemaResponse = await fetch(`${API_BASE_URL}/api/labtests/debug/schema`);
    
    if (!schemaResponse.ok) {
      console.warn(`Primary schema check failed, trying alternate format`);
      
      // Try the alternate format
      const altResponse = await fetch(`${API_BASE_URL}/labtests/debug/schema`);
      
      if (!altResponse.ok) {
        console.error(`All schema checks failed`);
        return {
          status: 'ERROR',
          error: `Schema checks failed. Primary endpoint status: ${schemaResponse.status}, alternate status: ${altResponse.status}`
        };
      }
      
      const altData = await altResponse.json();
      console.log('Lab test schema info (alternate format):', altData);
      
      return {
        status: 'SUCCESS',
        schema: altData,
        note: 'Used alternate endpoint format with hyphen'
      };
    }
    
    const schemaData = await schemaResponse.json();
    console.log('Lab test schema info:', schemaData);
    
    // Return schema information
    return {
      status: 'SUCCESS',
      schema: schemaData
    };
  } catch (error) {
    console.error('Error checking lab test database:', error);
    return {
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Debug function to help diagnose lab test API issues
export const diagnoseLabTestApi = async () => {
  console.log('Running lab test API diagnostics...');
  
  try {
    // 1. Check if backend is reachable
    const healthCheck = await fetch(`${API_BASE_URL}/api/health`);
    console.log(`Backend health check: ${healthCheck.status}`);
    
    // 2. Try direct endpoint with correct table name (without underscore)
    try {
      const directResponse = await fetch(`${API_BASE_URL}/api/labtests/visit/1`);
      console.log(`Primary /api/labtests/visit/1 status: ${directResponse.status}`);
      
      if (directResponse.ok) {
        const data = await directResponse.json();
        console.log(`Found ${data.length} lab tests:`, data);
      } else {
        console.log('Error response:', await directResponse.text());
      }
    } catch (e) {
      console.error('Primary endpoint error:', e);
    }
    
    // 3. Try alternate endpoint (with underscore)
    try {
      const altResponse = await fetch(`${API_BASE_URL}/labtests/visit/1`);
      console.log(`Alternate /labtests/visit/1 status: ${altResponse.status}`);
      
      if (altResponse.ok) {
        const data = await altResponse.json();
        console.log(`Found ${data.length} lab tests:`, data);
      } else {
        console.log('Error response:', await altResponse.text());
      }
    } catch (e) {
      console.error('Alternate endpoint error:', e);
    }
    
    // 4. Try direct query endpoint
    try {
      const directQueryResponse = await fetch(`${API_BASE_URL}/api/labtests/direct/visit/1`);
      console.log(`Direct query /api/labtests/direct/visit/1 status: ${directQueryResponse.status}`);
      
      if (directQueryResponse.ok) {
        const data = await directQueryResponse.json();
        console.log(`Found ${data.length} lab tests:`, data);
      } else {
        console.log('Error response:', await directQueryResponse.text());
      }
    } catch (e) {
      console.error('Direct query endpoint error:', e);
    }
    
    // 5. Try debug schema endpoint
    try {
      const schemaResponse = await fetch(`${API_BASE_URL}/api/labtests/debug/schema`);
      console.log(`Schema endpoint status: ${schemaResponse.status}`);
      
      if (schemaResponse.ok) {
        const data = await schemaResponse.json();
        console.log('Schema data:', data);
      } else {
        console.log('Error response:', await schemaResponse.text());
      }
    } catch (e) {
      console.error('Schema endpoint error:', e);
    }
    
    return {
      message: 'Diagnostics complete. Check console for results.',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Diagnostic error:', error);
    return {
      error: 'Diagnostic failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Fallback function to ensure lab tests are saved
export const saveLabTestsLocally = async (visitId: string | number, labTests: any[], patientId?: string): Promise<boolean> => {
  try {
    // Create a storage key that uniquely identifies this set of lab tests
    const storageKey = `labTests_${visitId}_${patientId || 'unknown'}`;
    
    // Create metadata for easier recovery
    const data = {
      visitId,
      patientId,
      labTests,
      savedAt: new Date().toISOString(),
      pending: true, // Mark as pending for future sync
      syncAttempts: 0
    };
    
    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify(data));
    console.log('Lab tests saved to localStorage with key:', storageKey);
    
    // Add to the list of pending lab tests for future sync
    try {
      const pendingKeysJSON = localStorage.getItem('pendingLabTestKeys') || '[]';
      const pendingKeys = JSON.parse(pendingKeysJSON);
      
      if (!pendingKeys.includes(storageKey)) {
        pendingKeys.push(storageKey);
        localStorage.setItem('pendingLabTestKeys', JSON.stringify(pendingKeys));
        console.log('Updated pendingLabTestKeys in localStorage:', pendingKeys);
      }
    } catch (keyError) {
      console.error('Error updating pending lab test keys:', keyError);
    }
    
    // Try to retrieve to confirm
    const retrieved = localStorage.getItem(storageKey);
    if (retrieved) {
      console.log('Successfully retrieved saved lab tests from localStorage');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error saving lab tests locally:', error);
    return false;
  }
};

// Function to retrieve lab tests stored locally
export const getLocallyStoredLabTests = (visitId: string | number, patientId?: string): any[] => {
  try {
    const storageKey = `labTests_${visitId}_${patientId || 'unknown'}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      console.log('No locally stored lab tests found for:', storageKey);
      return [];
    }
    
    const data = JSON.parse(storedData);
    console.log('Successfully retrieved locally stored lab tests:', data);
    
    return data.labTests || [];
  } catch (error) {
    console.error('Error retrieving locally stored lab tests:', error);
    return [];
  }
};

// Function to sync all pending lab tests
export const syncOfflineLabTests = async (): Promise<{success: number, failed: number}> => {
  try {
    // Only run this function if online
    if (!navigator.onLine) {
      console.log('Device is offline, skipping sync');
      return { success: 0, failed: 0 };
    }
    
    // Initialize result object
    const result = {
      success: 0,
      failed: 0
    };
    
    // Get all pending lab test keys
    const pendingKeysJSON = localStorage.getItem('pendingLabTestKeys') || '[]';
    const pendingKeys = JSON.parse(pendingKeysJSON);
    
    if (pendingKeys.length === 0) {
      console.log('No pending lab tests to sync');
      return result;
    }
    
    console.log(`Found ${pendingKeys.length} pending lab test sets to sync`);
    
    // Process each pending key
    const remainingKeys = [];
    
    for (const key of pendingKeys) {
      try {
        // Get the stored data
        const storedData = localStorage.getItem(key);
        if (!storedData) {
          console.warn(`No data found for key: ${key}`);
          continue;
        }
        
        const data = JSON.parse(storedData);
        
        // Skip if not marked as pending
        if (!data.pending) {
          console.log(`Skipping ${key} as it's not marked as pending`);
          continue;
        }
        
        // Try to save to server
        try {
          console.log(`Attempting to sync lab tests for key: ${key}`);
          const savedTests = await saveLabTests(data.visitId, data.labTests, data.patientId);
          
          if (savedTests && savedTests.length > 0) {
            console.log(`Successfully synced ${savedTests.length} lab tests for key: ${key}`);
            
            // Update the stored data to mark as synced
            data.pending = false;
            data.syncedAt = new Date().toISOString();
            localStorage.setItem(key, JSON.stringify(data));
            
            result.success++;
          } else {
            console.warn(`Failed to sync lab tests for key: ${key}`);
            
            // Update sync attempt count
            data.syncAttempts = (data.syncAttempts || 0) + 1;
            localStorage.setItem(key, JSON.stringify(data));
            
            // Keep in the pending list if under max attempts
            if (data.syncAttempts < 5) {
              remainingKeys.push(key);
            }
            
            result.failed++;
          }
        } catch (syncError) {
          console.error(`Error syncing lab tests for key: ${key}`, syncError);
          
          // Update sync attempt count
          data.syncAttempts = (data.syncAttempts || 0) + 1;
          localStorage.setItem(key, JSON.stringify(data));
          
          // Keep in the pending list if under max attempts
          if (data.syncAttempts < 5) {
            remainingKeys.push(key);
          }
          
          result.failed++;
        }
      } catch (keyError) {
        console.error(`Error processing key: ${key}`, keyError);
        remainingKeys.push(key);
        result.failed++;
      }
    }
    
    // Update the pending keys list
    localStorage.setItem('pendingLabTestKeys', JSON.stringify(remainingKeys));
    
    console.log(`Sync complete: ${result.success} successful, ${result.failed} failed, ${remainingKeys.length} remaining`);
    return result;
  } catch (error) {
    console.error('Error in syncOfflineLabTests:', error);
    return { success: 0, failed: 0 };
  }
};

// Authentication API endpoints
export const loginDoctor = async (doctorId: string, password: string): Promise<DoctorAuth> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ doctorId, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // For auth failures, return the response with authenticated flag as false
      return {
        ...data,
        authenticated: false,
      };
    }
    // Do not store doctor info in localStorage
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    return {
      doctorId: '',
      authenticated: false,
      message: 'Failed to connect to authentication server. Please check if the backend is running.',
    };
  }
};

export const getDoctorProfile = async (doctorId: string): Promise<DoctorAuth | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/doctor/${doctorId}`);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    return null;
  }
};

export const checkLoggedInStatus = (): DoctorAuth | null => {
  return null;
};

export const logoutDoctor = (): void => {
  // No-op for doctor info
};

export const updateDoctorStatus = async (doctorId: string, status: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/doctor/${doctorId}/status?status=${encodeURIComponent(status)}`, {
      method: 'PUT',
    });
    return response.ok;
  } catch (error) {
    console.error('Error updating doctor status:', error);
    return false;
  }
};

export const fetchActiveNurses = async () => {
  const response = await fetch(`${API_BASE_URL}/api/nurses/active`);
  if (!response.ok) throw new Error('Failed to fetch nurses');
  return response.json();
}; 