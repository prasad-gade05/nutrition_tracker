import React, { useState } from "react";
import {
  getDailyTotals,
  getMacroAverages,
  getStackedMacros,
  getNutrientTrend,
  getHeatmapData,
} from "../utils/trends";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip as ReactTooltip } from "react-tooltip";

const macroColors = ["#27ae60", "#2980b9", "#e67e22"];
const macroLabels = ["Protein", "Carbs", "Fat"];
const macroKeys = ["protein", "carbs", "fat"];

const nutrientOptions = [
  { key: "calories", label: "Calories" },
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fat", label: "Fat (g)" },
  { key: "fiber", label: "Fiber (g)" },
  { key: "sugar", label: "Sugar (g)" },
  { key: "vitaminA", label: "Vitamin A (mcg)" },
  { key: "vitaminC", label: "Vitamin C (mg)" },
  { key: "vitaminD", label: "Vitamin D (mcg)" },
  { key: "vitaminB6", label: "Vitamin B6 (mg)" },
  { key: "vitaminB12", label: "Vitamin B12 (mcg)" },
  { key: "sodium", label: "Sodium (mg)" },
  { key: "iron", label: "Iron (mg)" },
  { key: "calcium", label: "Calcium (mg)" },
  { key: "potassium", label: "Potassium (mg)" },
  { key: "magnesium", label: "Magnesium (mg)" },
];

const TrendsDashboard = () => {
  // Date range state
  const today = startOfDay(new Date());
  const [rangeType, setRangeType] = useState("week");
  const [customStart, setCustomStart] = useState(
    format(subDays(today, 6), "yyyy-MM-dd")
  );
  const [customEnd, setCustomEnd] = useState(format(today, "yyyy-MM-dd"));
  const [nutrient, setNutrient] = useState("calories");

  // Calculate range
  let startDate, endDate;
  if (rangeType === "week") {
    startDate = subDays(today, 6);
    endDate = today;
  } else if (rangeType === "month") {
    startDate = subDays(today, 29);
    endDate = today;
  } else {
    startDate = startOfDay(new Date(customStart));
    endDate = endOfDay(new Date(customEnd));
  }

  // Data for charts
  const dailyTotals = getDailyTotals(startDate, endDate);
  const macroAverages = getMacroAverages(startDate, endDate);
  const stackedMacros = getStackedMacros(startDate, endDate);
  const nutrientTrend = getNutrientTrend(startDate, endDate, nutrient);
  const heatmapData = getHeatmapData();

  // Pie chart data
  const pieData = [
    { name: "Protein", value: macroAverages.protein },
    { name: "Carbs", value: macroAverages.carbs },
    { name: "Fat", value: macroAverages.fat },
  ];

  // Pie chart tooltip
  const renderPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0];
      let avg = 0;
      if (name === "Protein") avg = macroAverages.avgProtein;
      if (name === "Carbs") avg = macroAverages.avgCarbs;
      if (name === "Fat") avg = macroAverages.avgFat;
      return (
        <div
          style={{ background: "#fff", border: "1px solid #ccc", padding: 8 }}
        >
          <strong>{name}</strong>: {value.toFixed(1)}%<br />
          Avg: {avg.toFixed(1)}g/day
        </div>
      );
    }
    return null;
  };

  // Heatmap color scale
  function getHeatColor(count) {
    if (count === 0) return "#eee";
    if (count < 500) return "#b7e4c7";
    if (count < 1000) return "#74c69d";
    if (count < 2000) return "#40916c";
    return "#1b4332";
  }

  return (
    <div className="trends-dashboard">
      <h2>Trends & Analytics</h2>

      {/* Date Range Selector */}
      <div className="trends-range-selector">
        <button
          className={rangeType === "week" ? "active" : ""}
          onClick={() => setRangeType("week")}
        >
          This Week
        </button>
        <button
          className={rangeType === "month" ? "active" : ""}
          onClick={() => setRangeType("month")}
        >
          This Month
        </button>
        <button
          className={rangeType === "custom" ? "active" : ""}
          onClick={() => setRangeType("custom")}
        >
          Custom
        </button>
        {rangeType === "custom" && (
          <span style={{ marginLeft: 12 }}>
            <input
              type="date"
              value={customStart}
              max={customEnd}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <span style={{ margin: "0 8px" }}>to</span>
            <input
              type="date"
              value={customEnd}
              min={customStart}
              max={format(today, "yyyy-MM-dd")}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </span>
        )}
      </div>

      {/* Calorie Trend Line Chart */}
      <section className="trends-section">
        <h3>Calorie Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={dailyTotals}
            margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
          >
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="calories"
              stroke="#27ae60"
              strokeWidth={3}
              dot={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Average Macronutrient Donut Chart */}
      <section className="trends-section">
        <h3>Average Macronutrient Breakdown</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              fill="#8884d8"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {pieData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={macroColors[idx]} />
              ))}
            </Pie>
            <Tooltip content={renderPieTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </section>

      {/* Daily Macronutrient Stacked Bar Chart */}
      <section className="trends-section">
        <h3>Daily Macronutrient Calories</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={stackedMacros}
            margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
          >
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <CartesianGrid strokeDasharray="3 3" />
            <Bar
              dataKey="protein"
              stackId="a"
              fill="#27ae60"
              name="Protein (kcal)"
            />
            <Bar
              dataKey="carbs"
              stackId="a"
              fill="#2980b9"
              name="Carbs (kcal)"
            />
            <Bar dataKey="fat" stackId="a" fill="#e67e22" name="Fat (kcal)" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Calendar Heatmap */}
      <section className="trends-section">
        <h3>Calendar Heatmap (Past 6 Months)</h3>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <CalendarHeatmap
            startDate={heatmapData[0]?.date}
            endDate={heatmapData[heatmapData.length - 1]?.date}
            values={heatmapData}
            classForValue={(value) => {
              if (!value) return "color-empty";
              return "color-github";
            }}
            showWeekdayLabels={true}
            gutterSize={3}
            style={{ width: "100%" }}
            transformDayElement={(el, value) => {
              const color = getHeatColor(value.count);
              // Tooltip attributes
              const tooltipAttrs =
                value && value.date
                  ? {
                      "data-tooltip-id": "calendar-heatmap-tooltip",
                      "data-tooltip-content": `${value.date}: ${value.count} kcal`,
                      tabIndex: 0,
                      style: { fill: color, cursor: "pointer" },
                    }
                  : { style: { fill: color } };
              return React.cloneElement(el, tooltipAttrs);
            }}
          />
          <Tooltip id="calendar-heatmap-tooltip" />
        </div>
      </section>

      {/* Nutrient Deep Dive */}
      <section className="trends-section">
        <h3>Nutrient Deep Dive</h3>
        <div style={{ marginBottom: 12 }}>
          <select
            value={nutrient}
            onChange={(e) => setNutrient(e.target.value)}
          >
            {nutrientOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={nutrientTrend}
            margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
          >
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8e44ad"
              strokeWidth={3}
              dot={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
};

export default TrendsDashboard;
