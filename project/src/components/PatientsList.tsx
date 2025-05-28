import React, { useState, useEffect, useRef } from 'react';
import { Users, Calendar, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';
import type { Patient } from '../types';
import { fetchPatientsByCategory, searchPatients, checkHealth } from '../services/api';

interface PatientsListProps {
  onSelectPatient: (patient: Patient) => void;
  refreshTrigger?: number;
}

export function PatientsList({ onSelectPatient, refreshTrigger = 0 }: PatientsListProps) {
  const [selectedDate, setSelectedDate] = useState<'today' | 'yesterday' | 'all' | 'consulted'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [cachedPatients, setCachedPatients] = useState<Patient[]>([]); // Cache for faster searching
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean>(true);
  const [searchResults, setSearchResults] = useState<'local' | 'api' | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Generate search suggestions from cached patients
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const suggestions = new Set<string>();
    
    // Generate suggestions from patient names
    cachedPatients.forEach(patient => {
      if (patient.name?.toLowerCase().includes(query) && !suggestions.has(patient.name)) {
        suggestions.add(patient.name);
      }
      
      // Generate suggestions from complaints
      if (patient.complaints?.toLowerCase().includes(query) && 
          !suggestions.has(patient.complaints) && 
          suggestions.size < 10) {
        suggestions.add(patient.complaints);
      }
    });
    
    setSearchSuggestions(Array.from(suggestions).slice(0, 5)); // Limit to 5 suggestions
  }, [searchQuery, cachedPatients]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check API health
  useEffect(() => {
    const verifyApiHealth = async () => {
      const isHealthy = await checkHealth();
      setApiAvailable(isHealthy);
      if (!isHealthy) {
        setError('API server is not responding. Please check your backend service.');
      }
    };
    
    verifyApiHealth();
    // Check API health every 30 seconds
    const intervalId = setInterval(verifyApiHealth, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Fetch patients based on selected date category or when refreshTrigger changes
  useEffect(() => {
    const fetchPatients = async () => {
      if (!apiAvailable) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Refreshing patient list...', new Date().toISOString());
        
        // For 'consulted' session, fetch all patients and filter for consulted ones
        // Important: maintain original order from API (first come, first out)
        if (selectedDate === 'consulted') {
          const data = await fetchPatientsByCategory('all');
          // Filter but DO NOT sort - maintain original order from API
          const consultedPatients = data.filter(patient => patient.totalVisits && patient.totalVisits > 0);
          setPatients(consultedPatients);
          setCachedPatients(data); // Cache all patients for searching
        } else {
          const data = await fetchPatientsByCategory(selectedDate);
          // Use data as-is without any sorting
          setPatients(data);
          setCachedPatients(prevCache => {
            // Merge new patients with existing cache for more comprehensive search
            const mergedPatients = [...prevCache];
            data.forEach(newPatient => {
              const existingIndex = mergedPatients.findIndex(p => 
                (p.patientId && p.patientId === newPatient.patientId) || 
                (p.id && p.id === newPatient.id)
              );
              if (existingIndex >= 0) {
                // Update existing
                mergedPatients[existingIndex] = newPatient;
              } else {
                // Add new
                mergedPatients.push(newPatient);
              }
            });
            return mergedPatients;
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients. Please try again later.');
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [selectedDate, apiAvailable, refreshTrigger]);

  // Handle search with client-side filtering for instant results
  useEffect(() => {
    if (!apiAvailable) {
      return;
    }
    
    const handleSearch = async () => {
      if (searchQuery.trim().length === 0) {
        // If search query is empty, fetch by category (already done in the previous effect)
        try {
          setLoading(true);
          
          // For 'consulted' session, fetch all patients and filter for consulted ones
          if (selectedDate === 'consulted') {
            const data = await fetchPatientsByCategory('all');
            const consultedPatients = data.filter(patient => patient.totalVisits && patient.totalVisits > 0);
            setPatients(consultedPatients);
          } else {
            const data = await fetchPatientsByCategory(selectedDate);
            setPatients(data);
          }
          
          setSearchResults(null);
          setError(null);
        } catch (err) {
          console.error('Error fetching patients:', err);
          setError('Failed to load patients. Please try again later.');
        } finally {
          setLoading(false);
        }
      } else if (searchQuery.trim().length >= 1) { // Now react with just 1 character
        try {
          setLoading(true);
          // Use enhanced searchPatients with cached data for instant results
          const data = await searchPatients(searchQuery, cachedPatients);
          
          // If client-side search returned results
          if (data.length > 0) {
            setSearchResults('local');
            
            // If in consulted session, filter search results for consulted patients
            if (selectedDate === 'consulted') {
              const consultedPatients = data.filter(patient => patient.totalVisits && patient.totalVisits > 0);
              setPatients(consultedPatients);
            } else {
              setPatients(data);
            }
            
            setError(null);
            setLoading(false);
          } else {
            // If client-side search returned no results, try the API
            const apiData = await searchPatients(searchQuery);
            setSearchResults('api');
            
            if (selectedDate === 'consulted') {
              const consultedPatients = apiData.filter(patient => patient.totalVisits && patient.totalVisits > 0);
              setPatients(consultedPatients);
            } else {
              setPatients(apiData);
            }
          }
        } catch (err) {
          console.error('Error searching patients:', err);
          setError('Failed to search patients. Please try again later.');
        } finally {
          setLoading(false);
        }
      }
    };

    // Add shorter debounce for more responsiveness
    const timeoutId = setTimeout(handleSearch, 150);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedDate, apiAvailable, cachedPatients]);

  // Add this function to highlight matched text in search results
  const highlightMatch = (text: string | undefined, query: string): React.ReactNode => {
    if (!text || !query || query.trim() === '') return text;
    
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    
    if (!normalizedText.includes(normalizedQuery)) return text;
    
    const parts = normalizedText.split(normalizedQuery);
    const result: React.ReactNode[] = [];
    
    let currentIndex = 0;
    parts.forEach((part, i) => {
      // Add the non-matching part
      if (part.length > 0) {
        result.push(text.substring(currentIndex, currentIndex + part.length));
        currentIndex += part.length;
      }
      
      // Add the matching part (highlighted)
      if (i < parts.length - 1) {
        const matchText = text.substring(currentIndex, currentIndex + normalizedQuery.length);
        result.push(<span key={i} className="bg-yellow-200 font-medium">{matchText}</span>);
        currentIndex += normalizedQuery.length;
      }
    });
    
    return <>{result}</>;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Patients</h2>
          </div>
          <span className="text-sm text-gray-500">
            {patients.length} total
            {searchResults === 'local' && searchQuery.trim() && (
              <span className="ml-1 text-xs text-blue-500">(instant results)</span>
            )}
          </span>
        </div>
        <div className="flex justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            {(['today', 'yesterday', 'all'] as const).map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedDate === date
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
                disabled={!apiAvailable}
              >
                {date.charAt(0).toUpperCase() + date.slice(1)}
              </button>
            ))}
            <button
              onClick={() => setSelectedDate('consulted')}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedDate === 'consulted'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
              disabled={!apiAvailable}
            >
              Consulted
            </button>
          </div>
        </div>
        <div className="relative" ref={searchInputRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, complaint, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!apiAvailable}
          />
          {searchQuery.trim().length > 0 && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          
          {/* Suggestions dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
              <ul className="py-1 max-h-60 overflow-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <li 
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    {highlightMatch(suggestion, searchQuery)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {!apiAvailable ? (
          <div className="text-center p-8 text-red-500 font-medium">
            <p>Cannot connect to the server. Please make sure your backend is running.</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={() => checkHealth().then(isHealthy => setApiAvailable(isHealthy))}
            >
              Retry Connection
            </button>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center p-4 text-red-500">{error}</div>
        ) : patients.length === 0 ? (
          <div className="text-center p-4 text-gray-500">No patients found</div>
        ) : (
          <div className="divide-y">
            {patients.map((patient) => (
              <div
                key={patient.patientId || patient.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectPatient(patient)}
              >
                <div className="flex items-center gap-4">
                  {patient.photo ? (
                    <img
                      src={patient.photo}
                      alt={`${patient.name}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center overflow-hidden">
                      <img 
                        src="https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png" 
                        alt="Default profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initial if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '';
                          target.parentElement!.innerHTML = `<span class="text-blue-500 font-medium">${patient.name?.charAt(0) || '?'}</span>`;
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">
                        {searchQuery.trim() ? highlightMatch(patient.name, searchQuery) : patient.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        patient.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                        patient.status === 'Critical' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {patient.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {searchQuery.trim() ? highlightMatch(patient.complaints, searchQuery) : patient.complaints}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {patient.visitDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {searchQuery.trim() ? (
                              highlightMatch(format(new Date(patient.visitDate), 'MMM dd, yyyy'), searchQuery)
                            ) : (
                              format(new Date(patient.visitDate), 'MMM dd, yyyy')
                            )}
                          </span>
                        </div>
                      )}
                      {patient.visitTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{patient.visitTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}