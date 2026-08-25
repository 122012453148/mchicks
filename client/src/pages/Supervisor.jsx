import React, { useState } from 'react';
import useActiveBatch from '../hooks/useActiveBatch';
import { supervisorService } from '../services/api';
import { UserCheck, Share2, Printer, Save, FileDown } from 'lucide-react';

export default function Supervisor() {
  const { activeBatch, visits, stats, loading, refreshData, logs } = useActiveBatch();
  const [copied, setCopied] = useState(false);

  const aiLogs = logs?.filter(l => l.imagePath && l.aiAnalysis) || [];
  const latestAiLog = aiLogs.length > 0 ? aiLogs[aiLogs.length - 1] : null;

  // Form states
  const [sampleCount, setSampleCount] = useState(10);
  const [avgWeight, setAvgWeight] = useState('');
  const [mortality, setMortality] = useState('');
  const [feedStatus, setFeedStatus] = useState('Normal');
  const [waterStatus, setWaterStatus] = useState('Normal');
  const [temp, setTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [litter, setLitter] = useState('Good');
  const [obs, setObs] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (Number(sampleCount) <= 0) {
      setError('Sample count must be greater than zero.');
      return;
    }
    if (Number(avgWeight) <= 0 || Number(mortality) < 0) {
      setError('Weight and mortality cannot be negative.');
      return;
    }
    if (Number(mortality) > (stats?.liveBirds || 0)) {
      setError(`Mortality (${mortality}) cannot exceed currently live birds (${stats?.liveBirds})`);
      return;
    }
    if (Number(temp) <= 0 || Number(humidity) <= 0) {
      setError('Shed temperature and humidity must be positive numbers.');
      return;
    }

    try {
      await supervisorService.createVisit(activeBatch.batchId, {
        date: new Date(),
        birdAge: stats.currentAge,
        sampleCount: Number(sampleCount),
        averageWeight: Number(avgWeight),
        mortality: Number(mortality),
        feedStatus,
        waterStatus,
        shedTemperature: Number(temp),
        shedHumidity: Number(humidity),
        litterCondition: litter,
        generalObservation: obs,
        remarks
      });

      setSuccess('Supervisor report card generated successfully!');
      refreshData();
      // Reset
      setAvgWeight('');
      setMortality('');
      setObs('');
      setRemarks('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit supervisor visit.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `M-CHICKS Supervisor Report\nBatch: ${activeBatch.batchId}\nDate: ${new Date().toLocaleDateString()}\nBird Age: Day ${stats.currentAge}\nLive Birds: ${stats.liveBirds}\nMortality: ${stats.mortalityPct}%\nAverage Weight: ${stats.latestAverageWeight} g\nFeed Remaining: ${stats.feedRemainingBags} bags\nFarm FCR: ${stats.farmFCR}\nGrowth FCR: ${stats.growthFCR}\nEnvironment: ${stats.envStatus}\nOverall: ${stats.performanceScore >= 80 ? 'GOOD' : stats.performanceScore >= 60 ? 'MONITOR' : 'ATTENTION'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      {/* Top action header */}
      <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-3">
          <UserCheck className="w-8 h-8 text-brand-primary" />
          <div>
            <h2 className="text-xl font-extrabold text-brand-primary">Supervisor Visits</h2>
            <p className="text-xs text-gray-500 font-semibold">Track weekly inspections and generate report cards</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleShare}
            className="flex items-center px-4 py-2 border border-brand-primary text-brand-primary rounded-xl text-xs font-bold hover:bg-brand-highlight/10 transition-colors"
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            {copied ? 'Copied Link!' : 'Share Text'}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary/95 transition-colors shadow-md"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print Card
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form to submit visit */}
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm h-fit">
          {latestAiLog && (
            <div className="bg-brand-bg p-4 rounded-xl border border-brand-highlight/20 shadow-sm mb-6">
              <h4 className="text-xs font-black text-brand-primary uppercase mb-1">Latest AI Visual Summary (Day {latestAiLog.birdAge})</h4>
              <p className="text-[10px] text-orange-500 font-bold mb-3">AI visual analysis is supplementary. Rely on actual measurements.</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-600 mb-3">
                <div>Growth: <span className="text-brand-primary font-bold">{latestAiLog.aiAnalysis.flockAppearance}</span></div>
                <div>Uniformity: <span className="text-brand-primary font-bold">{latestAiLog.aiAnalysis.visualUniformity}</span></div>
                <div>Quality: <span className="text-brand-primary font-bold">{latestAiLog.aiAnalysis.imageQuality}</span></div>
              </div>
              <p className="text-[11px] text-gray-500 italic leading-relaxed">"{latestAiLog.aiAnalysis.visibleObservations}"</p>
            </div>
          )}

          <h3 className="text-base font-extrabold text-brand-primary border-b border-red-50 pb-2 mb-4">
            Record Supervisor Visit
          </h3>
          {error && <div className="bg-red-50 p-2.5 text-red-700 text-xs font-bold rounded mb-3">{error}</div>}
          {success && <div className="bg-green-50 p-2.5 text-green-700 text-xs font-bold rounded mb-3">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">Avg Weight (g)</label>
                <input
                  type="number"
                  required
                  value={avgWeight}
                  onChange={(e) => setAvgWeight(e.target.value)}
                  placeholder="e.g. 620"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">Mortality Today</label>
                <input
                  type="number"
                  required
                  value={mortality}
                  onChange={(e) => setMortality(e.target.value)}
                  placeholder="e.g. 5"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">Shed Temp (°C)</label>
                <input
                  type="number"
                  required
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  placeholder="e.g. 29"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">Shed Humid (%)</label>
                <input
                  type="number"
                  required
                  value={humidity}
                  onChange={(e) => setHumidity(e.target.value)}
                  placeholder="e.g. 70"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">General Observation</label>
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                rows="2"
                placeholder="Flock distribution is active, water line clean..."
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-brand-primary/95 transition-all"
            >
              <Save className="w-3.5 h-3.5 mr-1.5 inline" /> Save Report Card
            </button>
          </form>
        </div>

        {/* Supervisor visits logs / cards */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-extrabold text-brand-primary">Historical Inspection Cards</h3>
          
          {visits.length === 0 ? (
            <p className="text-xs text-gray-400">No supervisor reports logged yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visits.map((visit, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-red-50 pb-2">
                    <span className="text-xs font-black text-brand-primary">Report Card #{visits.length - idx}</span>
                    <span className="text-[10px] font-bold text-gray-400">{new Date(visit.date).toLocaleDateString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <div className="text-gray-400">Age: <span className="text-gray-700 font-extrabold">Day {visit.birdAge}</span></div>
                    <div className="text-gray-400">Avg Weight: <span className="text-brand-primary font-black">{visit.averageWeight} g</span></div>
                    <div className="text-gray-400">Mortality: <span className="text-red-500 font-black">{visit.mortality} birds</span></div>
                    <div className="text-gray-400">Litter: <span className="text-gray-700 font-extrabold">{visit.litterCondition}</span></div>
                  </div>

                  <div className="bg-brand-bg p-2.5 rounded-lg border border-red-50 text-[11px] font-semibold text-gray-600">
                    <span className="block text-[9px] text-gray-400 uppercase font-black mb-0.5">Observations</span>
                    {visit.generalObservation || 'No specific observations noted.'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
