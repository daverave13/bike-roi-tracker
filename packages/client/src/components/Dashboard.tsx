import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useStats, useRides } from "../hooks/useApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function Dashboard() {
  const { stats, loading: statsLoading, error: statsError } = useStats();
  const { rides, loading: ridesLoading } = useRides();

  const chartData = useMemo(() => {
    if (!rides || rides.length === 0) return null;

    // Sort rides by date ascending
    const sortedRides = [...rides].sort(
      (a, b) => new Date(a.date + "T00:00:00").getTime() - new Date(b.date + "T00:00:00").getTime()
    );

    const labels = sortedRides.map((r) =>
      new Date(r.date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    );

    // Gas prices over time
    const gasPrices = sortedRides.map((r) => r.gas_price);

    // Cumulative miles
    let cumulative = 0;
    const cumulativeMiles = sortedRides.map((r) => {
      cumulative += r.distance;
      return cumulative;
    });

    return { labels, gasPrices, cumulativeMiles };
  }, [rides]);

  const gasPriceChartData = {
    labels: chartData?.labels || [],
    datasets: [
      {
        label: "Gas Price ($/gal)",
        data: chartData?.gasPrices || [],
        borderColor: "rgb(220, 38, 38)",
        backgroundColor: "rgba(220, 38, 38, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const milesChartData = {
    labels: chartData?.labels || [],
    datasets: [
      {
        label: "Cumulative Miles",
        data: chartData?.cumulativeMiles || [],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const milesChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (statsLoading || ridesLoading)
    return <div className="card">Loading stats...</div>;
  if (statsError) return <div className="card error">{statsError}</div>;
  if (!stats) return null;

  return (
    <>
      <div className="card">
        <h2>Your Bike ROI</h2>
        <div className="stats-grid">
          <div className="stat-box">
            <div className="value">${stats.totalSavings.toFixed(2)}</div>
            <div className="label">Total Saved</div>
          </div>
          <div className="stat-box">
            <div className="value">{stats.totalRides}</div>
            <div className="label">Rides Logged</div>
          </div>
          <div className="stat-box">
            <div className="value">{stats.totalDistance.toFixed(0)}</div>
            <div className="label">Miles Biked</div>
          </div>
          <div className="stat-box">
            <div className="value">${stats.avgSavings.toFixed(2)}</div>
            <div className="label">Avg per Ride</div>
          </div>
          <div className="stat-box">
            <div className="value">${stats.avgGasPrice.toFixed(2)}</div>
            <div className="label">Avg Gas Price</div>
          </div>
        </div>
      </div>

      {chartData && chartData.labels.length > 0 && (
        <>
          <div className="card">
            <h3>Gas Price History</h3>
            <div style={{ height: "250px" }}>
              <Line data={gasPriceChartData} options={chartOptions} />
            </div>
          </div>

          <div className="card">
            <h3>Cumulative Miles Biked</h3>
            <div style={{ height: "250px" }}>
              <Line data={milesChartData} options={milesChartOptions} />
            </div>
          </div>
        </>
      )}

      {(!chartData || chartData.labels.length === 0) && (
        <div className="card">
          <p style={{ textAlign: "center", color: "#666" }}>
            Log some rides to see your charts!
          </p>
        </div>
      )}
    </>
  );
}
