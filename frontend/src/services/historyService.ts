import axios from 'axios';
import type { ItemHistory, ItemSnapshot } from '../types/history';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${BASE_API_URL.replace('/api', '')}/api/history`;

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const historyService = {
  // Get history for a specific item
  async getItemHistory(itemId: number): Promise<ItemHistory[]> {
    const response = await axios.get(`${API_URL}/item/${itemId}`, {
      headers: getAuthHeader()
    });
    return response.data.history;
  },

  // Get snapshots for a specific item
  async getItemSnapshots(itemId: number): Promise<ItemSnapshot[]> {
    const response = await axios.get(`${API_URL}/snapshots/item/${itemId}`, {
      headers: getAuthHeader()
    });
    return response.data.snapshots;
  },

  // Create manual snapshot
  async createManualSnapshot(): Promise<{ message: string; count: number; updated: boolean }> {
    const response = await axios.post(`${API_URL}/snapshot`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Get snapshots for a specific date
  async getSnapshotsByDate(date: string): Promise<ItemSnapshot[]> {
    const response = await axios.get(`${API_URL}/snapshots/date/${date}`, {
      headers: getAuthHeader()
    });
    return response.data.snapshots;
  },

  // Check if snapshot exists for today
  async checkSnapshotToday(): Promise<{ hasSnapshot: boolean; date: string }> {
    const response = await axios.get(`${API_URL}/snapshot/today`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};
