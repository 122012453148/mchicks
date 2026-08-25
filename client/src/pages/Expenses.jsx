import React, { useState } from 'react';
import useActiveBatch from '../hooks/useActiveBatch';
import { expenseService } from '../services/api';
import { PlusCircle, Trash, Save } from 'lucide-react';

export default function Expenses() {
  const { activeBatch, expenses, stats, loading, refreshData } = useActiveBatch();
  const [category, setCategory] = useState('Electricity');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await expenseService.createExpense(activeBatch.batchId, {
        category,
        amount: Number(amount),
        description,
        date: new Date()
      });
      setSuccess('Expense logged successfully!');
      refreshData();
      setAmount('');
      setDescription('');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await expenseService.deleteExpense(activeBatch.batchId, id);
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm h-fit">
          <h3 className="text-base font-extrabold text-brand-primary border-b border-red-50 pb-2 mb-4">
            Log Farm Expense
          </h3>
          {success && <div className="bg-green-50 p-2 text-green-700 text-xs font-bold rounded mb-3">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                <option value="Electricity">Electricity</option>
                <option value="Water">Water</option>
                <option value="Labour">Labour</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Cooling">Cooling</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Amount (₹)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1500"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Generator fuel purchase"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-primary text-white font-bold text-sm rounded-xl shadow-md hover:bg-brand-primary/95 transition-all"
            >
              <Save className="w-4 h-4 mr-2 inline" /> Log Expense
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2 border-b border-red-50 pb-2">
            <h3 className="text-lg font-extrabold text-brand-primary">Batch Expenses</h3>
            <span className="text-xs font-black text-brand-highlight bg-brand-bg px-3 py-1.5 rounded-full border border-red-50">
              Total Expenses: ₹ {stats?.totalExpenses.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="bg-brand-bg text-brand-primary font-bold">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50 font-semibold text-gray-700">
                {expenses.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 px-3">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="py-2 px-3 font-extrabold text-brand-primary">{item.category}</td>
                    <td className="py-2 px-3">₹ {item.amount.toLocaleString()}</td>
                    <td className="py-2 px-3 text-xs text-gray-500 font-normal">{item.description || '-'}</td>
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
