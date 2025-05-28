import axios from 'axios';

export interface Nurse {
  id: number;
  name: string;
  status: string;
}

const API_BASE_URL = '/api/nurses';

export const nurseService = {
  getActiveNurses: async (): Promise<Nurse[]> => {
    try {
      console.log('Fetching active nurses...');
      const response = await axios.get(`${API_BASE_URL}/active`);
      console.log('Active nurses response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching active nurses:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        throw new Error(error.response?.data?.message || 'Failed to fetch active nurses');
      }
      console.error('Unexpected error:', error);
      throw new Error('An unexpected error occurred');
    }
  }
}; 