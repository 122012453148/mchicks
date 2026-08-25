import React, { useState } from 'react';
import useActiveBatch from '../hooks/useActiveBatch';
import { supplementService } from '../services/api';
import { PlusCircle, Trash, Save } from 'lucide-react';

export default function Supplements() {
  const { activeBatch, supplements, stats, loading, refreshData } = useActiveBatch();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('ml');
  const [cost, setCost] = useState('');
  const [purpose, setPurpose] = useState('');
  const [remarks, setRemarks] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await supplementService.createSupplement(activeBatch.batchId, {
        name,
        quantity: Number(quantity),
        unit,
        cost: Number(cost),
        purpose,
        remarks,
        date: new Date()
      });
      setSuccess('Supplement added!');
      refreshData();
      setName('');
      setQuantity('');
      setCost('');
      setPurpose('');
      setRemarks('');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await supplementService.deleteSupplement(activeBatch.batchId, id);
      refreshData();
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

  if (!activeBatch) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm text-center">
        <p className="text-gray-500 font-bold">Please create a batch first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm h-fit">
          <h3 className="text-base font-extrabold text-brand-primary border-b border-red-50 pb-2 mb-4">
            Log Supplement
          </h3>
          {success && <div className="bg-green-50 p-2 text-green-700 text-xs font-bold rounded mb-3">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Supplement Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electral, Vitamin Complex"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Quantity</label>
                <input
                  type="number"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="ml">ml</option>
                  <option value="litres">litres</option>
                  <option value="g">grams</option>
                  <option value="kg">kg</option>
                  <option value="packets">packets</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Total Cost (₹)</label>
              <input
                type="number"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Purpose</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Heat stress prevention"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-primary text-white font-bold text-sm rounded-xl shadow-md hover:bg-brand-primary/95 transition-all"
            >
              <Save className="w-4 h-4 mr-2 inline" /> Add Supplement
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-extrabold text-brand-primary">Logged Supplements</h3>
            <span className="text-xs font-black text-brand-highlight bg-brand-bg px-3 py-1.5 rounded-full border border-red-50">
              Total Cost: ₹ {stats?.totalSupplementCost.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="bg-brand-bg text-brand-primary font-bold">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Quantity</th>
                  <th className="py-2 px-3">Cost</th>
                  <th className="py-2 px-3">Purpose</th>
                  <th className="py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50 font-semibold text-gray-700">
                {supplements.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 px-3">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="py-2 px-3 font-extrabold text-brand-primary">{item.name}</td>
                    <td className="py-2 px-3">{item.quantity} {item.unit}</td>
                    <td className="py-2 px-3">₹ {item.cost.toLocaleString()}</td>
                    <td className="py-2 px-3 text-xs text-gray-500 font-normal">{item.purpose || '-'}</td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
