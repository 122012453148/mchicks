import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useActiveBatch from '../hooks/useActiveBatch';
import { 
  Users, Skull, Scale, Container, Activity, Thermometer, TrendingUp, AlertTriangle, 
  CheckCircle, Plus, Calendar, CloudSun, UserCheck, MessageSquare, Share2, ClipboardList, MapPin, RefreshCw, Camera, Image as ImageIcon, Eye
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function Dashboard() {
  const { activeBatch, logs, weights, weather, visits, stats, loading, error, refreshData, updateLocation } = useActiveBatch();
  const [copied, setCopied] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');

  const handleDetectLocation = () => {
    setLocating(true);
    setLocError('');
    if (!navigator.geolocation) {
      setLocError('Location detection is not supported on this device/browser.');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (accuracy > 5000) {
          setLocError('Location accuracy is low. Move to an open area and refresh location.');
        }

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          let address = 'Detected Location';
          if (data && data.address) {
             const city = data.address.city || data.address.town || data.address.village || data.address.county;
             const state = data.address.state;
             if (city && state) address = `${city}, ${state}`;
             else if (data.display_name) address = data.display_name.split(',').slice(0, 2).join(', ');
          }
          await updateLocation(latitude, longitude, address);
        } catch (err) {
          setLocError('Location detected, but address could not be loaded.');
          await updateLocation(latitude, longitude, 'Detected Location');
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocError('Please allow location access to get farm-specific weather recommendations.');
        } else {
          setLocError('Unable to detect your current location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent"></div>
        <p className="text-sm font-bold text-gray-500">Loading Dashboard Data...</p>
      </div>
    );
  }

  if (error || !activeBatch) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-red-100 shadow-md text-center max-w-lg mx-auto mt-10">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-extrabold text-brand-primary mb-2">No Active Batch</h3>
        <p className="text-gray-600 mb-6">
          You currently don't have an active batch configured. Create a new batch to start tracking.
        </p>
        <Link
          to="/batches"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors shadow-lg"
        >
          Go to Batches
        </Link>
      </div>
    );
  }

  // Get recommendations
  const getRecommendations = () => {
    const recs = [];
    
    // Weight Alert
    if (stats.weightDiff < 0) {
      recs.push({
        type: 'growth',
        severity: 'orange',
        title: '⚠️ Bird Growth Alert',
        desc: `Current average weight (${stats.latestAverageWeight}g) is below target (${stats.targetWeight}g) by ${Math.abs(stats.weightDiff)}g.`,
        checks: [
          'Verify feeder availability and feed distribution.',
          'Confirm water flow and pressure levels.',
          'Review the recent daily feed intake log with the supervisor.'
        ]
      });
    }

    // Temperature Alert
    const currentTemp = weather?.temperature || stats.shedTemp;
    if (currentTemp > stats.targetObj.targetTempMax) {
      recs.push({
        type: 'temp-high',
        severity: 'red',
        title: '🔴 Heat Stress Risk',
        desc: `Current temperature (${currentTemp}°C) is relatively high for this bird age (above the maximum target range of ${stats.targetObj.targetTempMax}°C).`,
        checks: [
          'Monitor shed ventilation and bird behavior.',
          'Ensure sufficient clean drinking water and avoid unnecessary heat inside the shed.',
          'Check fogger/cooling pads status.'
        ]
      });
    } else if (currentTemp < stats.targetObj.targetTempMin) {
      recs.push({
        type: 'temp-low',
        severity: 'blue',
        title: '🔵 Cold Stress Risk',
        desc: `Current temperature (${currentTemp}°C) is relatively low for this bird age (below target range ${stats.targetObj.targetTempMin}°C).`,
        checks: [
          'Verify brooder/heating systems are operating correctly.',
          'Check for drafts and seal loose wall gaps.',
          'Observe bird behavior: verify if chicks are huddling under heaters.'
        ]
      });
    }

    // Feed Shortage Alert
    if (stats.feedRemainingBags < 15 && stats.currentAge < activeBatch.targetDays - 3) {
      recs.push({
        type: 'feed',
        severity: 'red',
        title: '🔴 Feed Shortage Forecast',
        desc: `Current remaining stock (${stats.feedRemainingBags} bags) covers approximately ${stats.feedCoverageDays} days, which is less than the ${activeBatch.targetDays - stats.currentAge} days remaining in this batch.`,
        checks: [
          `Order approximately ${Math.round((activeBatch.targetDays - stats.currentAge) * (stats.totalFeedBagsUsed / (stats.currentAge || 1)) - stats.feedRemainingBags)} bags additional feed immediately.`,
          'Verify feed consumption levels with feed supplier.'
        ]
      });
    }

    // Mortality Alert
    const latestLog = logs[logs.length - 1];
    if (latestLog && latestLog.mortality > 10) {
      recs.push({
        type: 'mortality',
        severity: 'red',
        title: '🔴 Mortality Spike Alert',
        desc: `Today's deaths count (${latestLog.mortality}) is higher than the normal threshold.`,
        checks: [
          'Inspect bird distribution and signs of respiratory discomfort.',
          'Review water intake and feed quality logs.',
          'Consult the farm supervisor or veterinary professional immediately.'
        ]
      });
    }

    // Data Quality Alerts
    const todayStr = new Date().toISOString().split('T')[0];
    const hasTodayLog = logs.some(l => new Date(l.date).toISOString().split('T')[0] === todayStr);
    if (!hasTodayLog) {
      recs.push({
        type: 'missing-log',
        severity: 'orange',
        title: '⚠️ Missing Daily Log',
        desc: "No operational log has been registered for today. Complete the daily record to update indicators.",
        checks: ['Record today\'s feed, mortality, and environment details in the Daily Log.']
      });
    }

    const latestWeight = weights[weights.length - 1];
    if (!latestWeight || (stats.currentAge - latestWeight.birdAge > 7)) {
      recs.push({
        type: 'missing-weight',
        severity: 'orange',
        title: '⚠️ Missing Weight Update',
        desc: "No weight samples have been logged in the last 7 days.",
        checks: ['Weigh a random sample of birds to update growth FCR and weight trend curves.']
      });
    }

    // Fallback normal recommendation
    if (recs.length === 0) {
      recs.push({
        type: 'normal',
        severity: 'green',
        title: '🟢 Operations Stable',
        desc: 'All parameters (growth, environment, mortality, and feed stock) are currently running within target thresholds.',
        checks: [
          'Maintain current ventilation and feeding schedules.',
          'Ensure routine water line flushing is completed.'
        ]
      });
    }

    return recs;
  };

  const shareText = () => {
    const text = `M-CHICKS REPORT\nBatch: ${activeBatch.batchId}\nAge: Day ${stats.currentAge} / ${activeBatch.targetDays}\nLive Birds: ${stats.liveBirds}\nMortality: ${stats.totalMortality} (${stats.mortalityPct}%)\nAvg Weight: ${stats.latestAverageWeight}g\nFarm FCR: ${stats.farmFCR}\nShed Temp: ${stats.shedTemp}°C\nPerformance Score: ${stats.performanceScore}/100`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const aiLogs = logs.filter(l => l.imagePath && l.aiAnalysis);
  const latestAiLog = aiLogs.length > 0 ? aiLogs[aiLogs.length - 1] : null;

  // AI Recommendation Logic based on image and data conflicts
  const getAiRecommendation = () => {
    if (!latestAiLog) return null;
    const ai = latestAiLog.aiAnalysis;
    const isWeightGood = stats.weightDiff >= -30;
    
    if ((ai.flockAppearance === 'Needs Review' || ai.visualUniformity === 'Poor') && isWeightGood) {
      return "Visual appearance requires monitoring even though recorded average weight is currently acceptable. Consider taking another representative sample.";
    }
    
    if (ai.flockAppearance === 'Good' && !isWeightGood) {
      return "Visual appearance alone should not be considered proof of satisfactory growth. Verify average weight using scale measurements and review feed/environment data.";
    }

    if (ai.imageQuality === 'Poor') {
      return "Image quality is not sufficient for reliable visual analysis. Please upload a clearer and more representative flock image.";
    }

    return "Continue monitoring average weight and flock uniformity. Maintain consistent feed and environmental management. Verify weight using a representative scale sample.";
  };

  const aiRecommendation = getAiRecommendation();

  // Prepare Weight Chart Data
  const chartData = weights.map(w => {
    const targetObj = settings?.breedTargets?.[activeBatch.breed]?.find(t => t.day === w.birdAge) || {};
    return {
      day: `Day ${w.birdAge}`,
      Actual: w.averageWeight,
      Target: targetObj.targetWeight || 0
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-brand-primary text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <span className="bg-brand-highlight/20 text-brand-highlight px-3 py-1 rounded-full text-xs font-bold border border-brand-highlight/30">
            Active Batch
          </span>
          <h2 className="text-3xl font-black mt-2 tracking-tight">{activeBatch.batchId}</h2>
          <p className="text-white/70 text-sm mt-1">
            Started {new Date(activeBatch.startDate).toLocaleDateString()} &bull; Breed: {activeBatch.breed}
          </p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-xs text-white/60 uppercase tracking-wider font-bold">Age Progress</p>
            <p className="text-3xl font-extrabold mt-0.5">Day {stats.currentAge} / {activeBatch.targetDays}</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-brand-highlight/30 flex items-center justify-center font-bold text-lg bg-brand-highlight/10">
            {Math.min(100, Math.round((stats.currentAge / activeBatch.targetDays) * 100))}%
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Live Birds */}
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-bold tracking-wide uppercase">Live Birds</span>
            <Users className="w-5 h-5 text-brand-primary" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-brand-primary">{stats.liveBirds.toLocaleString()}</h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">Initial: {activeBatch.initialChicks}</p>
          </div>
        </div>

        {/* Card 2: Mortality */}
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-bold tracking-wide uppercase">Mortality</span>
            <Skull className="w-5 h-5 text-red-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-brand-primary">{stats.totalMortality} birds</h3>
            <p className="text-[10px] text-red-500 font-bold mt-1">{stats.mortalityPct}% Rate</p>
          </div>
        </div>

        {/* Card 3: Avg Weight */}
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-bold tracking-wide uppercase">Avg Weight</span>
            <Scale className="w-5 h-5 text-brand-highlight" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-brand-primary">{stats.latestAverageWeight} g</h3>
            <p className={`text-[10px] font-bold mt-1 ${stats.weightDiff >= 0 ? 'text-green-600' : 'text-orange-500'}`}>
              {stats.weightDiff >= 0 ? `+${stats.weightDiff}g Above` : `${stats.weightDiff}g Below`} Target
            </p>
          </div>
        </div>

        {/* Card 4: FCR (Farm / Growth) */}
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-bold tracking-wide uppercase">FCR (Farm/Growth)</span>
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-brand-primary">{stats.farmFCR} / {stats.growthFCR}</h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">Lower is better</p>
          </div>
        </div>

        {/* Card 5: Performance Score */}
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-bold tracking-wide uppercase">Performance</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-brand-primary">{stats.performanceScore} / 100</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Score Card</p>
          </div>
        </div>
      </div>

      {/* Location and Weather Card */}
      <div className="bg-brand-bg p-6 rounded-2xl border border-brand-highlight/20 shadow-sm flex flex-col md:flex-row md:justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="flex-1">
          <h3 className="text-lg font-extrabold text-brand-primary flex items-center mb-3">
            <MapPin className="w-5 h-5 mr-2 text-brand-highlight" />
            FARM LOCATION & WEATHER
          </h3>
          
          {locError && (
            <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm mb-3">
              {locError}
            </div>
          )}

          {weather ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-brand-primary">
              <div>
                <p className="text-xs font-bold opacity-70">Location</p>
                <p className="font-extrabold flex items-center mt-1">
                  📍 {weather.address}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold opacity-70">Temperature</p>
                <p className="font-extrabold mt-1">🌡 {weather.temperature}°C (Feels like {weather.feelsLike}°C)</p>
              </div>
              <div>
                <p className="text-xs font-bold opacity-70">Humidity / Condition</p>
                <p className="font-extrabold mt-1">💧 {weather.humidity}% &bull; ☁ {weather.condition}</p>
              </div>
              <div>
                <p className="text-xs font-bold opacity-70">Status</p>
                <p className="font-extrabold mt-1">
                  {weather.isDemo || !activeBatch?.farmLocation ? 'LOCATION UNAVAILABLE' : 'LIVE'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-brand-primary/70">Weather data unavailable.</p>
          )}
        </div>
        <div className="md:ml-6 flex-shrink-0">
          <button
            onClick={handleDetectLocation}
            disabled={locating}
            className="flex items-center justify-center px-4 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-brand-primary/90 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${locating ? 'animate-spin' : ''}`} />
            {activeBatch?.farmLocation && weather && !weather.isDemo ? 'Refresh Location' : 'Detect My Farm Location'}
          </button>
        </div>
      </div>

      {/* AI Growth Insight Card */}
      {latestAiLog && (
        <div className="bg-brand-bg p-6 rounded-2xl border border-brand-highlight/20 shadow-sm">
          <div className="flex justify-between items-start border-b border-brand-primary/10 pb-4 mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-brand-primary flex items-center">
                <Eye className="w-5 h-5 mr-2 text-brand-highlight" />
                AI FARM GROWTH INSIGHT
              </h3>
              <p className="text-xs font-semibold text-brand-primary/70 mt-1 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1 text-orange-500" />
                AI visual analysis is a supporting observation only. Based on Day {latestAiLog.birdAge} photo.
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
              latestAiLog.aiAnalysis.flockAppearance === 'Good' ? 'bg-green-500' :
              latestAiLog.aiAnalysis.flockAppearance === 'Needs Review' ? 'bg-red-500' : 'bg-orange-500'
            }`}>
              {latestAiLog.aiAnalysis.flockAppearance === 'Good' ? '🟢 ON TRACK' :
               latestAiLog.aiAnalysis.flockAppearance === 'Needs Review' ? '🔴 NEEDS REVIEW' : '🟡 NEEDS MONITORING'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500">Recorded Weight</p>
                  <p className="font-extrabold text-brand-primary mt-0.5">{stats.latestAverageWeight} g</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500">Weight Trend</p>
                  <p className={`font-extrabold mt-0.5 ${stats.weightDiff >= -30 ? 'text-green-600' : 'text-orange-500'}`}>
                    {stats.weightDiff >= -30 ? 'Improving' : 'Below Target'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500">Visual Uniformity</p>
                  <p className="font-extrabold text-brand-primary mt-0.5">{latestAiLog.aiAnalysis.visualUniformity}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500">Image Quality</p>
                  <p className="font-extrabold text-brand-primary mt-0.5">{latestAiLog.aiAnalysis.imageQuality}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-gray-500">Today's Recommendation</p>
                <div className="mt-1 bg-white p-3 rounded-xl border border-brand-primary/10 text-sm font-semibold text-brand-primary shadow-sm">
                  {aiRecommendation}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500">AI Observation</p>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed italic">
                  "{latestAiLog.aiAnalysis.visibleObservations}"
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="w-full md:w-48 h-32 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                <img 
                  src={latestAiLog.imagePath} 
                  alt="Latest Flock" 
                  className="w-full h-full object-cover"
                  onError={(e) => {e.target.style.display = 'none'}}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 font-semibold">Latest Image: Day {latestAiLog.birdAge}</p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Status & Action Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Status */}
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-brand-primary border-b border-red-50 pb-3 flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-brand-highlight" />
            Today's Farm Status
          </h3>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-500">Bird Growth</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${stats.weightDiff >= -30 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                {stats.weightDiff >= -30 ? '🟢 On Track' : '🟠 Below Target'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-500">Feed Stock</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${stats.feedRemainingBags >= 15 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {stats.feedRemainingBags >= 15 ? '🟢 Sufficient' : '🔴 Shortage Risk'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-500">Mortality</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${stats.mortalityPct < 3.5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {stats.mortalityPct < 3.5 ? '🟢 Normal' : '🔴 Critical'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-500">Shed Environment</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${stats.envStatus === 'Good' ? 'bg-green-100 text-green-800' : stats.envStatus === 'Attention' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                {stats.envStatus === 'Good' ? '🟢 Good' : stats.envStatus === 'Attention' ? '🟠 Attention' : '🔴 Critical'}
              </span>
            </div>
          </div>
        </div>

        {/* Action / Recommendations */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-brand-primary border-b border-red-50 pb-3 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-brand-primary" />
              Smart Recommendations
            </h3>
            <div className="mt-4 space-y-4">
              {getRecommendations().map((rec, i) => (
                <div key={i} className="space-y-2">
                  <div className="font-bold text-brand-primary">{rec.title}</div>
                  <p className="text-sm text-gray-600">{rec.desc}</p>
                  <ul className="list-disc list-inside text-xs text-gray-500 space-y-1 pl-1">
                    {rec.checks.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
        <h3 className="text-lg font-extrabold text-brand-primary mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-brand-primary" />
          Quick Entry Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Link to="/logs" className="flex flex-col items-center justify-center p-4 bg-brand-bg rounded-xl border border-red-100 hover:bg-brand-highlight/5 transition-all text-center">
            <ClipboardList className="w-6 h-6 text-brand-primary mb-2" />
            <span className="text-xs font-bold text-brand-primary">Daily Entry</span>
          </Link>
          <Link to="/weight" className="flex flex-col items-center justify-center p-4 bg-brand-bg rounded-xl border border-red-100 hover:bg-brand-highlight/5 transition-all text-center">
            <Scale className="w-6 h-6 text-brand-primary mb-2" />
            <span className="text-xs font-bold text-brand-primary">Add Weight</span>
          </Link>
          <Link to="/feed" className="flex flex-col items-center justify-center p-4 bg-brand-bg rounded-xl border border-red-100 hover:bg-brand-highlight/5 transition-all text-center">
            <Container className="w-6 h-6 text-brand-primary mb-2" />
            <span className="text-xs font-bold text-brand-primary">Add Feed</span>
          </Link>
          <Link to="/mortality" className="flex flex-col items-center justify-center p-4 bg-brand-bg rounded-xl border border-red-100 hover:bg-brand-highlight/5 transition-all text-center">
            <Skull className="w-6 h-6 text-brand-primary mb-2" />
            <span className="text-xs font-bold text-brand-primary">Add Mortality</span>
          </Link>
          <Link to="/supervisor" className="flex flex-col items-center justify-center p-4 bg-brand-bg rounded-xl border border-red-100 hover:bg-brand-highlight/5 transition-all text-center">
            <UserCheck className="w-6 h-6 text-brand-primary mb-2" />
            <span className="text-xs font-bold text-brand-primary">Supervisor Log</span>
          </Link>
        </div>
      </div>

      {/* Weight Chart Section */}
      {weights.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
          <h3 className="text-lg font-extrabold text-brand-primary mb-4">Actual vs Target Weight Gain (grams)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#C8DFDB" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                <YAxis tick={{ fontSize: 11, fontWeight: 'bold' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Actual" stroke="#1B2CC1" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Target" stroke="#7692FF" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Supervisor Latest Visit Card */}
      {visits.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
          <div className="flex justify-between items-center border-b border-red-50 pb-3 mb-4">
            <h3 className="text-lg font-extrabold text-brand-primary flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-brand-primary" />
              Latest Supervisor Visit Card
            </h3>
            <button
              onClick={shareText}
              className="flex items-center text-xs font-bold text-brand-primary hover:text-brand-highlight bg-brand-bg px-3 py-1.5 rounded-lg border border-red-50 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 mr-1" />
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-brand-bg p-4 rounded-xl border border-red-100">
            <div>
              <p className="text-gray-400 font-bold text-xs uppercase">Visit Date</p>
              <p className="font-extrabold text-brand-primary mt-0.5">{new Date(visits[0].date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold text-xs uppercase">Avg Weight</p>
              <p className="font-extrabold text-brand-primary mt-0.5">{visits[0].averageWeight} g</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold text-xs uppercase">Litter Condition</p>
              <p className="font-extrabold text-brand-primary mt-0.5">{visits[0].litterCondition}</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold text-xs uppercase">General Obs</p>
              <p className="font-extrabold text-brand-primary mt-0.5 truncate">{visits[0].generalObservation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chicken Growth Photo Timeline */}
      {aiLogs.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm mt-6">
          <h3 className="text-lg font-extrabold text-brand-primary mb-6 flex items-center">
            <ImageIcon className="w-5 h-5 mr-2 text-brand-primary" />
            Chicken Growth Photo Timeline
          </h3>
          <div className="flex overflow-x-auto pb-4 space-x-4 snap-x">
            {aiLogs.map((log) => (
              <div key={log._id} className="min-w-[280px] bg-brand-bg rounded-xl border border-brand-highlight/20 overflow-hidden snap-start flex-shrink-0 shadow-sm flex flex-col">
                <div className="h-40 w-full bg-gray-200 relative">
                  <img 
                    src={log.imagePath} 
                    alt={`Day ${log.birdAge}`} 
                    className="w-full h-full object-cover"
                    onError={(e) => {e.target.style.display = 'none'}}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                    <p className="text-white font-extrabold text-lg">Day {log.birdAge}</p>
                    <p className="text-white/80 text-xs font-semibold">{new Date(log.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 font-bold">Recorded Weight</p>
                      <p className="font-extrabold text-brand-primary">{weights.find(w => w.birdAge === log.birdAge)?.averageWeight || activeBatch.initialWeight} g</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-bold">Mortality</p>
                      <p className="font-extrabold text-brand-primary">{log.mortality} birds</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-bold">Temp</p>
                      <p className="font-extrabold text-brand-primary">{log.shedTemperature}°C</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-bold">Uniformity</p>
                      <p className="font-extrabold text-brand-primary">{log.aiAnalysis.visualUniformity}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-brand-primary/10">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">AI Visual Summary</p>
                    <p className="text-xs font-semibold text-brand-primary mt-1 truncate">
                      {log.aiAnalysis.flockAppearance === 'Good' ? '🟢' : log.aiAnalysis.flockAppearance === 'Needs Review' ? '🔴' : '🟡'} {log.aiAnalysis.visibleObservations}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
