const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export interface DoctorSummaryResponse {
  doctorId: string;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  department: string | null;
  createdAt: string | null;
}

export interface NurseResponse {
  nurseId: string;
  name: string;
  status: string;
  email?: string | null;
}

export interface DoctorCreateRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
  department?: string;
}

export interface NurseCreateRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
}

export async function fetchDoctorSummaries(): Promise<DoctorSummaryResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/doctors`);
  if (!response.ok) {
    throw new Error(`Failed to load doctors (${response.status})`);
  }
  return response.json();
}

export async function fetchAllNurses(): Promise<NurseResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/nurses`);
  if (!response.ok) {
    throw new Error(`Failed to load nurses (${response.status})`);
  }
  return response.json();
}

export async function createDoctor(payload: DoctorCreateRequest): Promise<DoctorSummaryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/doctors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Failed to create doctor (${response.status})`);
  }
  return response.json();
}

export async function createNurse(payload: NurseCreateRequest): Promise<NurseResponse> {
  const response = await fetch(`${API_BASE_URL}/api/nurses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Failed to create nurse (${response.status})`);
  }
  return response.json();
}
