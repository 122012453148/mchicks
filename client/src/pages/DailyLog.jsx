import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useActiveBatch from '../hooks/useActiveBatch';
import { logService } from '../services/api';
import { ClipboardList, HelpCircle, Save } from 'lucide-react';

export default function DailyLog() {
  const navigate = useNavigate();
  const { activeBatch, stats, loading, refreshData } = useActiveBatch();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    birdAge: 0,
    mortality: 0,
    mortalityReason: '',
    feedBagsUsed: 0,
    shedTemperature: 28,
    shedHumidity: 65,
    waterLiters: 0,
    litterCondition: 'Good',
    remarks: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (activeBatch && activeBatch.startDate) {
      const selectedDate = new Date(formData.date);
      selectedDate.setHours(0, 0, 0, 0);
      const start = new Date(activeBatch.startDate);
      start.setHours(0, 0, 0, 0);
      const diffTime = selectedDate - start;
      const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const calculatedAge = Math.max(1, daysDiff + 1);
      setFormData(prev => ({ ...prev, birdAge: calculatedAge }));
    }
  }, [formData.date, activeBatch]);

  // Estimate water usage based on feed consumption (approx 2.2L per kg of feed, where 1 bag = 75kg)
  useEffect(() => {
    if (formData.feedBagsUsed > 0) {
      const feedKg = formData.feedBagsUsed * (activeBatch?.bagWeight || 75);
      const estimatedWater = Math.round(feedKg * 2.2);
      setFormData(prev => ({ ...prev, waterLiters: estimatedWater }));
    }
  }, [formData.feedBagsUsed, activeBatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (Number(formData.mortality) < 0 || Number(formData.feedBagsUsed) < 0 || Number(formData.waterLiters) < 0) {
      setError('Values cannot be negative');
      return;
    }
    if (stats && Number(formData.mortality) > stats.liveBirds) {
      setError(`Mortality (${formData.mortality}) cannot exceed currently live birds (${stats.liveBirds})`);
      return;
    }

    try {
      if (imageFile) {
        const payload = new FormData();
        Object.keys(formData).forEach(key => payload.append(key, formData[key]));
        payload.append('image', imageFile);
        await logService.createLogWithImage(activeBatch.batchId, payload);
      } else {
        await logService.createLog(activeBatch.batchId, formData);
      }
      setSuccess('Daily record saved successfully!');
      refreshData();
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save log.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!activeBatch) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm text-center">
        <p className="text-gray-500 font-bold">Please create a batch first before logging data.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-red-100 shadow-sm max-w-3xl mx-auto p-6 md:p-8">
      <div className="flex items-center space-x-3 border-b border-red-50 pb-4 mb-6">
        <ClipboardList className="w-7 h-7 text-brand-primary" />
        <div>
          <h2 className="text-xl font-extrabold text-brand-primary">Record Daily Farm Log</h2>
          <p className="text-xs text-gray-500 font-semibold">Enter today's operational observations for {activeBatch.batchId}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 font-bold text-sm mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg text-green-700 font-bold text-sm mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Log Date</label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-3 h-12 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Bird Age (Day)</label>
            <input
              type="number"
              name="birdAge"
              required
              value={formData.birdAge}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-3 h-12 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Today's Feed Used (Bags)</label>
            <input
              type="number"
              name="feedBagsUsed"
              step="0.1"
              required
              value={formData.feedBagsUsed}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-3 h-12 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Today's Mortality (Deaths)</label>
            <input
              type="number"
              name="mortality"
              required
              value={formData.mortality}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Mortality Reason (if any)</label>
            <input
              type="text"
              name="mortalityReason"
              value={formData.mortalityReason}
              onChange={handleChange}
              placeholder="e.g. Heat stress, smothered"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Water Consumed (Litres)</label>
            <input
              type="number"
              name="waterLiters"
              required
              value={formData.waterLiters}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Shed Temperature (°C)</label>
            <input
              type="number"
              name="shedTemperature"
              required
              value={formData.shedTemperature}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Shed Humidity (%)</label>
            <input
              type="number"
              name="shedHumidity"
              required
              value={formData.shedHumidity}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Litter Condition</label>
            <select
              name="litterCondition"
              value={formData.litterCondition}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="Good">Good (Dry/Loose)</option>
              <option value="Wet">Wet</option>
              <option value="Caked">Caked</option>
              <option value="Dry">Dry</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">General Notes / Remarks</label>
          <textarea
            name="remarks"
            rows="2"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="E.g. Cleaned water lines, birds active..."
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Upload Chicken Photo (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-bg file:text-brand-primary hover:file:bg-brand-highlight/20"
          />
          {imageFile && (
            <div className="mt-2">
              <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-32 object-cover rounded-lg border border-gray-300" />
              <button type="button" onClick={() => setImageFile(null)} className="text-red-500 text-xs mt-2 font-bold bg-red-50 px-2 py-1 rounded">Remove Image</button>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-red-50">
          <button
            type="submit"
            className="flex items-center justify-center px-6 py-3 bg-brand-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-brand-primary/95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Daily Log
          </button>
        </div>
      </form>
    </div>
  );
}
