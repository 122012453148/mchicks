import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { batchService } from '../services/api';
import { Layers, HelpCircle, Save } from 'lucide-react';

export default function AddBatch() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    batchId: '',
    startDate: new Date().toISOString().split('T')[0],
    initialChicks: 4100,
    initialWeight: 35,
    breed: 'Broiler Chicken',
    shedNumber: 1,
    shedLength: 48,
    shedWidth: 28,
    targetDays: 36,
    feedAllocationBags: 160,
    bagWeight: 75,
    preStarterBags: 25,
    starterBags: 25,
    growerBags: 35,
    finisherBags: 75,
    notes: ''
  });

  const [area, setArea] = useState(1344);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const calculatedArea = Number(formData.shedLength || 0) * Number(formData.shedWidth || 0);
    setArea(calculatedArea);
  }, [formData.shedLength, formData.shedWidth]);

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

    // Validation checks
    if (Number(formData.shedLength) <= 0 || Number(formData.shedWidth) <= 0) {
      setError('Shed dimensions must be positive numbers');
      return;
    }
    if (Number(formData.initialChicks) <= 0 || Number(formData.initialWeight) <= 0) {
      setError('Chicks count and weight must be positive numbers');
      return;
    }

    try {
      await batchService.createBatch(formData);
      setSuccess('Batch created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      const rawError = err.response?.data?.error;
      const errMsg = typeof rawError === 'string' ? rawError : (rawError?.message || '');
      if (errMsg.includes('duplicate key') || errMsg.includes('E11000')) {
        setError(`Batch ID "${formData.batchId}" already exists. Please use a different Batch ID (e.g., BATCH-002).`);
      } else {
        setError(errMsg || 'Failed to create batch. Please check all fields and try again.');
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-red-100 shadow-sm max-w-4xl mx-auto p-6 md:p-8">
      <div className="flex items-center space-x-3 border-b border-red-50 pb-4 mb-6">
        <Layers className="w-7 h-7 text-brand-primary" />
        <div>
          <h2 className="text-xl font-extrabold text-brand-primary">Add New Batch</h2>
          <p className="text-xs text-gray-500 font-semibold">Start tracking a new flock placement</p>
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
          {/* Section 1: Batch Info */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Batch ID / Name</label>
            <input
              type="text"
              name="batchId"
              required
              placeholder="e.g. BATCH-2026-002"
              value={formData.batchId}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-3 h-12 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Arrival Date</label>
            <input
              type="date"
              name="startDate"
              required
              value={formData.startDate}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-3 h-12 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Breed</label>
            <select
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-3 h-12 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="Broiler Chicken">Broiler Chicken (Cobb 500)</option>
              <option value="Ross 308">Ross 308</option>
              <option value="Hubbard">Hubbard</option>
            </select>
          </div>

          {/* Section 2: Chicks Info */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Number of Chicks</label>
            <input
              type="number"
              name="initialChicks"
              required
              value={formData.initialChicks}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Initial Avg Weight (g)</label>
            <input
              type="number"
              name="initialWeight"
              required
              value={formData.initialWeight}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Chick Purchase Cost (₹)</label>
            <input
              type="text"
              disabled
              value="₹0 (Company Placed)"
              className="mt-1 block w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm font-bold text-green-600 outline-none"
            />
          </div>

          {/* Section 3: Shed Info */}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Shed Number</label>
            <input
              type="number"
              name="shedNumber"
              required
              value={formData.shedNumber}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Shed Length (ft)</label>
            <input
              type="number"
              name="shedLength"
              required
              value={formData.shedLength}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Shed Width (ft)</label>
            <input
              type="number"
              name="shedWidth"
              required
              value={formData.shedWidth}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Calculated Shed Area</label>
            <input
              type="text"
              disabled
              value={`${area.toLocaleString()} sq.ft`}
              className="mt-1 block w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm font-extrabold text-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Target Growing Period (days)</label>
            <input
              type="number"
              name="targetDays"
              required
              value={formData.targetDays}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Default Feed Bag Weight (kg)</label>
            <input
              type="number"
              name="bagWeight"
              required
              value={formData.bagWeight}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Section 4: Feed Allocations */}
        <div className="border-t border-red-50 pt-4">
          <h3 className="text-base font-extrabold text-brand-primary mb-4">Feed Allocation (Bags)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Pre-Starter</label>
              <input
                type="number"
                name="preStarterBags"
                value={formData.preStarterBags}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Starter</label>
              <input
                type="number"
                name="starterBags"
                value={formData.starterBags}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Grower</label>
              <input
                type="number"
                name="growerBags"
                value={formData.growerBags}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Finisher</label>
              <input
                type="number"
                name="finisherBags"
                value={formData.finisherBags}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Notes / Remarks</label>
          <textarea
            name="notes"
            rows="3"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Initial details, vaccination schedules..."
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-red-50">
          <button
            type="submit"
            className="flex items-center justify-center px-6 py-3 bg-brand-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-brand-primary/95 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 mr-2" />
            Create Batch
          </button>
        </div>
      </form>
    </div>
  );
}
