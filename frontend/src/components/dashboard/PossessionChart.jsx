import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import DemoBadge from '../common/DemoBadge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const PossessionChart = ({ possessionTrend = [], teamA, teamB }) => {
  const labels = possessionTrend.map((p) => p.minute);
  const teamAData = possessionTrend.map((p) => p.team_a_pct);
  const teamBData = possessionTrend.map((p) => p.team_b_pct);

  const lineChartData = {
    labels,
    datasets: [
      {
        label: teamA?.team_name || 'Manchester Blue (Demo)',
        data: teamAData,
        borderColor: '#38BDF8', // Sky Blue
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#38BDF8',
        pointBorderColor: '#05070B',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: teamB?.team_name || 'London Red (Demo)',
        data: teamBData,
        borderColor: '#EF4444', // Crimson Red
        backgroundColor: 'rgba(239, 68, 68, 0.06)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#EF4444',
        pointBorderColor: '#05070B',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: '#94A3B8',
          font: { family: 'Inter', size: 12 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#0F172A',
        borderColor: '#1E2638',
        borderWidth: 1,
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(30, 38, 56, 0.5)' },
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 11 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(30, 38, 56, 0.5)' },
        ticks: {
          color: '#64748B',
          font: { family: 'JetBrains Mono', size: 11 },
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  const comparisonData = {
    labels: ['Pass Accuracy %', 'Pass Volume / 10', 'Distance (km)', 'High Runs / 2'],
    datasets: [
      {
        label: teamA?.team_name || 'Manchester Blue',
        data: [
          teamA?.pass_accuracy_pct || 89.1,
          (teamA?.total_passes || 612) / 10,
          teamA?.total_distance_km || 112.4,
          (teamA?.high_intensity_runs || 142) / 2,
        ],
        backgroundColor: 'rgba(56, 189, 248, 0.85)',
        borderRadius: 6,
      },
      {
        label: teamB?.team_name || 'London Red',
        data: [
          teamB?.pass_accuracy_pct || 84.0,
          (teamB?.total_passes || 431) / 10,
          teamB?.total_distance_km || 116.1,
          (teamB?.high_intensity_runs || 156) / 2,
        ],
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94A3B8',
          font: { family: 'Inter', size: 12 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#0F172A',
        borderColor: '#1E2638',
        borderWidth: 1,
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'Inter', size: 12 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid: { color: 'rgba(30, 38, 56, 0.5)' },
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 11 } },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Possession Flow Line Chart */}
      <div className="bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-5 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Possession Momentum Flow</h3>
              <DemoBadge size="xs" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              15-minute match intervals (Simulated game dominance curve)
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            90 Mins Active
          </span>
        </div>
        <div className="h-64">
          <Line data={lineChartData} options={chartOptions} />
        </div>
      </div>

      {/* Head-to-Head Comparative Metric Chart */}
      <div className="bg-[#0A0E17] border border-[#1E2638] rounded-2xl p-5 shadow-xl shadow-black/40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Team Performance Benchmark</h3>
              <DemoBadge size="xs" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative volume & physical exertion (Simulated demo metrics)
            </p>
          </div>
          <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
            Head-to-Head
          </span>
        </div>
        <div className="h-64">
          <Bar data={comparisonData} options={barOptions} />
        </div>
      </div>
    </div>
  );
};

export default PossessionChart;
