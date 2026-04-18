import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export interface Ride {
  id: number;
  date: string;
  gas_price: number;
  distance: number;
  savings: number;
  notes: string | null;
  weather: string | null;
  created_at: string;
}

export interface Stats {
  totalRides: number;
  totalSavings: number;
  totalDistance: number;
  avgSavings: number;
  avgGasPrice: number;
}

export interface Settings {
  default_distance: string;
  mpg: string;
  eia_api_key: string;
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/stats`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}

export function useRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRides = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/rides`);
      if (!res.ok) throw new Error('Failed to fetch rides');
      const data = await res.json();
      setRides(data.rides);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const createRide = async (rideData: Partial<Ride>) => {
    const res = await fetch(`${API_BASE}/rides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rideData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create ride');
    }
    const ride = await res.json();
    setRides(prev => [ride, ...prev]);
    return ride;
  };

  const updateRide = async (id: number, rideData: Partial<Ride>) => {
    const res = await fetch(`${API_BASE}/rides/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rideData),
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const err = JSON.parse(text);
        throw new Error(err.error || 'Failed to update ride');
      } catch {
        throw new Error(`Failed to update ride (${res.status})`);
      }
    }
    const updatedRide = await res.json();
    setRides(prev => prev.map(r => r.id === id ? updatedRide : r));
    return updatedRide;
  };

  const deleteRide = async (id: number) => {
    const res = await fetch(`${API_BASE}/rides/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete ride');
    setRides(prev => prev.filter(r => r.id !== id));
  };

  return { rides, loading, error, refresh: fetchRides, createRide, updateRide, deleteRide };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/settings`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<Settings>) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    await fetchSettings();
  };

  return { settings, loading, error, refresh: fetchSettings, updateSettings };
}

export function useGasPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async (): Promise<number | null> => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/gas-price`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch gas price');
      }
      const data = await res.json();
      const fetchedPrice = typeof data.price === 'number' ? data.price : parseFloat(data.price);
      setPrice(fetchedPrice);
      return fetchedPrice;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { price, loading, error, fetchPrice };
}
