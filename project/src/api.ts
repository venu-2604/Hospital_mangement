export const saveLabTests = async (visitId: number, labTests: LabTestData[], patientId: number): Promise<any[]> => {
  try {
    console.log('Saving lab tests with visit ID:', visitId);
    console.log('Lab tests data:', labTests);
    
    // Transform data from camelCase to snake_case for backend
    const formattedLabTests = labTests.map(test => ({
      visit_id: visitId,
      patient_id: patientId,
      test_name: test.testName,
      result: test.result,
      reference_range: test.referenceRange,
      status: test.status
    }));
    
    console.log('Formatted lab tests data:', formattedLabTests);
    
    const response = await axios.post(`${API_URL}/labtests/batch`, formattedLabTests, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log('Lab tests save response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saving lab tests:', error);
    
    // Add specific error details for debugging
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: error.config
      });
    }
    
    // Re-throw to let caller handle
    throw error;
  }
};

/**
 * Save lab tests to local storage as a fallback when API is unavailable
 */
export const saveLabTestsLocally = async (
  visitId: number, 
  labTests: LabTestData[], 
  patientId: number
): Promise<boolean> => {
  try {
    // Create a unique key for this visit's lab tests
    const storageKey = `offline_labtests_visit_${visitId}_patient_${patientId}`;
    
    // Add timestamp for tracking
    const offlineData = {
      visitId,
      patientId,
      labTests,
      timestamp: new Date().toISOString(),
      synced: false
    };
    
    // Save to local storage
    localStorage.setItem(storageKey, JSON.stringify(offlineData));
    
    // Also maintain a list of pending offline data to sync later
    const pendingKeysString = localStorage.getItem('pendingLabTestKeys') || '[]';
    const pendingKeys = JSON.parse(pendingKeysString);
    
    if (!pendingKeys.includes(storageKey)) {
      pendingKeys.push(storageKey);
      localStorage.setItem('pendingLabTestKeys', JSON.stringify(pendingKeys));
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save lab tests locally:', error);
    return false;
  }
};

// Function to attempt sync of offline lab tests when online
export const syncOfflineLabTests = async (): Promise<{success: number, failed: number}> => {
  const result = {success: 0, failed: 0};
  
  try {
    const pendingKeysString = localStorage.getItem('pendingLabTestKeys');
    if (!pendingKeysString) return result;
    
    const pendingKeys = JSON.parse(pendingKeysString);
    const remainingKeys = [...pendingKeys];
    
    for (const key of pendingKeys) {
      try {
        const offlineDataString = localStorage.getItem(key);
        if (!offlineDataString) continue;
        
        const offlineData = JSON.parse(offlineDataString);
        
        // Attempt to save to the server
        await saveLabTests(
          offlineData.visitId, 
          offlineData.labTests, 
          offlineData.patientId
        );
        
        // If successful, remove from pending and mark as synced
        const index = remainingKeys.indexOf(key);
        if (index > -1) remainingKeys.splice(index, 1);
        
        // Update the item as synced but keep for record
        offlineData.synced = true;
        localStorage.setItem(key, JSON.stringify(offlineData));
        
        result.success++;
      } catch (error) {
        console.error(`Failed to sync offline lab tests for key ${key}:`, error);
        result.failed++;
      }
    }
    
    // Update the pending keys list
    localStorage.setItem('pendingLabTestKeys', JSON.stringify(remainingKeys));
    
    return result;
  } catch (error) {
    console.error('Error during offline lab tests sync:', error);
    return result;
  }
}; 