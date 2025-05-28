export interface Patient {
  patientId?: string;
  id?: string; // For backwards compatibility
  name: string;
  surname?: string;
  fatherName?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  regNo: string;
  opNo: string;
  visits?: number;
  totalVisits?: number;
  bp: string;
  weight: string;
  temperature?: string;
  lastVisit?: string;
  status: 'Active' | 'Recovered' | 'Critical';
  photo?: string;
  complaints?: string;
  visitDate?: string;
  visitTime?: string;
  bloodGroup?: string;
  aadharNumber?: string;
  phoneNumber?: string;
  address?: string;
  symptoms?: string;
}

export interface Doctor {
  doctorId: string;
  name?: string;
  email?: string;
  password?:string;
  role?: string;
  status?: string;
  department?: string;
  createdAt?:string;
}

export interface DoctorAuth {
  doctorId: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  department?: string;
  authenticated: boolean;
  message?: string;
}

export interface Visit {
  visitId?: string | number;
  id?: string; // For backwards compatibility
  patientId?: string;
  date?: string;
  visitDate?: string;
  visitTime?: string;
  bp?: string;
  weight?: string;
  temperature?: string;
  complaint?: string;
  prescription?: string;
  notes?: string;
  symptoms?: string;
  status?: string;
  labtests?: (LabTest | {
    name: string;
    test_name?: string;
    result: string;
    referenceRange?: string;
    reference_range?: string;
    status: 'normal' | 'abnormal' | 'critical' | string;
  })[];
  _sortableDate?: Date; // Internal field for sorting
}

export interface DoctorProfile {
  name: string;
  specialization: string;
  experience: string;
  patients: number;
  image: string;
}

export type LabTest = {
  // Primary fields (camelCase) - consistent with other interfaces
  testId?: string | number;         // Maps to test_id in database
  visitId?: string | number;        // Maps to visit_id in database
  patientId?: string;               // Maps to patient_id in database
  testName?: string;                // Maps to test_name in database
  result?: string;                  // Maps to result in database
  referenceRange?: string;          // Maps to reference_range in database
  status?: string;                  // Maps to status in database
  testGivenAt?: string;             // Maps to test_given_at in database
  resultUpdatedAt?: string;         // Maps to result_updated_at in database
  
  // UI/frontend specific fields
  id?: string;                      // Used for CommonLabTests identification
  name?: string;                    // Display name
  category?: string;                // For UI display only
  description?: string;             // For UI display only
  
  // Database fields (snake_case) - for direct database operations
  // These are kept for compatibility with existing database operations
  test_id?: string | number;
  visit_id?: string | number;
  patient_id?: string;
  test_name?: string;
  reference_range?: string;
  test_given_at?: string;
  result_updated_at?: string;
};

export const commonLabTests: LabTest[] = [
  // Hematology
  { id: 'cbc', name: 'Complete Blood Count (CBC)', category: 'Hematology', testName: 'Complete Blood Count (CBC)' },
  { id: 'hb', name: 'Hemoglobin', category: 'Hematology', testName: 'Hemoglobin' },
  { id: 'wbc', name: 'White Blood Cell Count', category: 'Hematology', testName: 'White Blood Cell Count' },
  { id: 'platelet', name: 'Platelet Count', category: 'Hematology', testName: 'Platelet Count' },
  { id: 'esr', name: 'ESR', category: 'Hematology', testName: 'Erythrocyte Sedimentation Rate' },
  
  // Biochemistry
  { id: 'glucose_fasting', name: 'Glucose Fasting', category: 'Biochemistry', testName: 'Glucose Fasting' },
  { id: 'glucose_pp', name: 'Glucose PP', category: 'Biochemistry', testName: 'Glucose Post Prandial' },
  { id: 'hba1c', name: 'HbA1c', category: 'Biochemistry', testName: 'Glycated Hemoglobin' },
  { id: 'lipid', name: 'Lipid Profile', category: 'Biochemistry', testName: 'Lipid Profile' },
  { id: 'liver', name: 'Liver Function Test', category: 'Biochemistry', testName: 'Liver Function Test' },
  { id: 'kidney', name: 'Kidney Function Test', category: 'Biochemistry', testName: 'Kidney Function Test' },
  
  // Urine
  { id: 'urine_routine', name: 'Urine Routine', category: 'Urine', testName: 'Urine Routine' },
  { id: 'urine_culture', name: 'Urine Culture', category: 'Urine', testName: 'Urine Culture' },
  { id: 'microalbumin', name: 'Microalbumin', category: 'Urine', testName: 'Microalbumin' },
  
  // Cardiac
  { id: 'ecg', name: 'ECG', category: 'Cardiac', testName: 'Electrocardiogram' },
  { id: 'echo', name: 'Echocardiogram', category: 'Cardiac', testName: 'Echocardiogram' },
  { id: 'troponin', name: 'Troponin', category: 'Cardiac', testName: 'Troponin' },
  
  // Imaging
  { id: 'xray_chest', name: 'X-Ray Chest', category: 'Imaging', testName: 'X-Ray Chest' },
  { id: 'usg_abdomen', name: 'USG Abdomen', category: 'Imaging', testName: 'Ultrasonography Abdomen' },
  { id: 'ct_scan', name: 'CT Scan', category: 'Imaging', testName: 'Computed Tomography Scan' },
  { id: 'mri', name: 'MRI', category: 'Imaging', testName: 'Magnetic Resonance Imaging' },
  
  // Thyroid
  { id: 't3', name: 'T3', category: 'Thyroid', testName: 'Triiodothyronine' },
  { id: 't4', name: 'T4', category: 'Thyroid', testName: 'Thyroxine' },
  { id: 'tsh', name: 'TSH', category: 'Thyroid', testName: 'Thyroid Stimulating Hormone' },
  
  // Other
  { id: 'covid', name: 'COVID-19 Test', category: 'Viral', testName: 'SARS-CoV-2 RT-PCR' },
  { id: 'dengue', name: 'Dengue Test', category: 'Viral', testName: 'Dengue NS1 Antigen' },
  { id: 'malaria', name: 'Malaria Test', category: 'Parasitic', testName: 'Malaria Parasite' },
  { id: 'typhoid', name: 'Typhoid Test', category: 'Bacterial', testName: 'Widal Test' }
];