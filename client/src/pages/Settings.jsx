import React, { useState, useEffect } from 'react';
import useActiveBatch from '../hooks/useActiveBatch';
import { settingsService } from '../services/api';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function Settings() {
  const { settings, refreshData, loading } = useActiveBatch();
  const [farmName, setFarmName] = useState('M-CHICKS');
  const [address, setAddress] = useState('Chengalpattu, Tamil Nadu');
  const [lat, setLat] = useState(12.6841);
  const [lng, setLng] = useState(79.9836);
  const [bagWeight, setBagWeight] = useState(75);
  const [chickPrice, setChickPrice] = useState(0);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (settings) {
      setFarmName(settings.farmName || 'M-CHICKS');
      setAddress(settings.location?.address || 'Chengalpattu, Tamil Nadu');
      setLat(settings.location?.lat || 12.6841);
      setLng(settings.location?.lng || 79.9836);
      setBagWeight(settings.defaultBagWeight || 75);
      setChickPrice(settings.chickCost || 0);
    }
  }, [settings]);

  const handleGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setAddress(`GPS Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await settingsService.updateSettings({
        farmName,
        location: { lat: Number(lat), lng: Number(lng), address },
        defaultBagWeight: Number(bagWeight),
        chickCost: Number(chickPrice)
      });
      setSuccess('Settings updated successfully!');
      refreshData();
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-red-100 shadow-sm max-w-3xl mx-auto p-6 md:p-8">
      <div className="flex items-center space-x-3 border-b border-red-50 pb-4 mb-6">
        <SettingsIcon className="w-7 h-7 text-brand-primary" />
        <div>
          <h2 className="text-xl font-extrabold text-brand-primary">Settings</h2>
          <p className="text-xs text-gray-500 font-semibold">Configure farm metadata, location details, and breed targets</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg text-green-700 font-bold text-sm mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Farm Name</label>
            <input
              type="text"
              required
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Default Bag Weight (kg)</label>
            <input
              type="number"
              required
              value={bagWeight}
              onChange={(e) => setBagWeight(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Chick Cost per Unit (₹)</label>
            <input
              type="number"
              required
              value={chickPrice}
              onChange={(e) => setChickPrice(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Location GPS Coordinates / Address</label>
            <div className="flex space-x-2 mt-1">
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={handleGPSLocation}
                className="px-3 bg-brand-bg text-brand-primary border border-red-100 hover:bg-brand-highlight/10 font-bold rounded-lg text-xs"
              >
                Fetch GPS
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-red-50">
          <button
            type="submit"
            className="flex items-center justify-center px-6 py-3 bg-brand-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-brand-primary/95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
