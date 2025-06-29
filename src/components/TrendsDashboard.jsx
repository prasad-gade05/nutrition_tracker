import React, { useState } from "react";
import {
  getDailyTotals,
  getMacroAverages,
  getStackedMacros,
  getNutrientTrend,
  getHeatmapData,
  getMetricRanges,
  getMetricColor,
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
  const [selectedMetric, setSelectedMetric] = useState("calories");
  const [selectedDate, setSelectedDate] = useState(null);

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
  const heatmapData = getHeatmapData(selectedMetric);
  const metricRanges = getMetricRanges(selectedMetric);

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

  // Function to format the tooltip content for native title attribute
  const formatTooltipString = (value) => {
    if (!value || !value.details) return "";
    const { details } = value;
    const date = new Date(value.date).toLocaleDateString();
    const metric =
      selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1);
    const mealCount = details.meals.length;
    const mealNames = details.meals
      .slice(0, 2)
      .map((m) => m.name)
      .join(", ");
    const moreMeals = mealCount > 2 ? ` and ${mealCount - 2} more...` : "";
    let str = `${date}\nTotal ${metric}: ${Math.round(
      value.count
    )}\nMeals: ${mealCount}`;
    if (mealCount > 0) {
      str += `\n${mealNames}${moreMeals}`;
    }
    return str;
  };

  // Function to handle click on a day
  const handleDayClick = (value) => {
    if (!value || !value.details) return;
    setSelectedDate(value);
  };

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
        <h3>Calorie & Protein Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={dailyTotals}
            margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
          >
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="calories"
              tick={{ fontSize: 12 }}
              domain={[0, 3000]}
              label={{ value: "Calories", angle: -90, position: "insideLeft" }}
            />
            <YAxis
              yAxisId="protein"
              orientation="right"
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
              label={{
                value: "Protein (g)",
                angle: 90,
                position: "insideRight",
              }}
            />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="calories"
              yAxisId="calories"
              stroke="#27ae60"
              strokeWidth={2.5}
              dot={{ r: 4 }}
              name="Calories"
            />
            <Line
              type="monotone"
              dataKey="protein"
              yAxisId="protein"
              stroke="#2980b9"
              strokeWidth={2.5}
              dot={{ r: 4 }}
              name="Protein (g)"
              strokeDasharray="5 5"
            />
            <Legend />
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

      {/* Calendar Heatmap Section */}
      <section className="trends-section">
        <h3>Activity Calendar</h3>

        {/* Metric Selector */}
        <div className="metric-selector">
          <label>Show: </label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
          >
            <option value="calories">Calories</option>
            <option value="protein">Protein</option>
            <option value="carbs">Carbs</option>
            <option value="fat">Fat</option>
          </select>
        </div>

        {/* Legend */}
        <div className="heatmap-legend">
          {metricRanges.map((range, index) => (
            <div key={index} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: range.color }}
              />
              <span>{range.label}</span>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div className="heatmap-container">
          <CalendarHeatmap
            startDate={new Date(heatmapData[0].date)}
            endDate={new Date(heatmapData[heatmapData.length - 1].date)}
            values={heatmapData}
            classForValue={() => ""}
            transformDayElement={(el, value) => {
              const color =
                value && value.count > 0
                  ? getMetricColor(value.count, selectedMetric)
                  : "#ebedf0";
              return React.cloneElement(el, {
                style: {
                  fill: color,
                  cursor: value && value.count > 0 ? "pointer" : "default",
                },
              });
            }}
            titleForValue={formatTooltipString}
            onClick={handleDayClick}
          />
        </div>

        {/* Selected Day Details */}
        {selectedDate && (
          <div className="selected-day-details">
            <h4>{new Date(selectedDate.date).toLocaleDateString()}</h4>
            <div className="day-summary">
              <div>
                Total Calories: {Math.round(selectedDate.details.calories)}
              </div>
              <div>
                Total Protein: {Math.round(selectedDate.details.protein)}g
              </div>
              <div>Total Carbs: {Math.round(selectedDate.details.carbs)}g</div>
              <div>Total Fat: {Math.round(selectedDate.details.fat)}g</div>
            </div>
            <div className="meals-list">
              <h5>Meals:</h5>
              {selectedDate.details.meals.map((meal, index) => (
                <div key={index} className="meal-item">
                  <div className="meal-time">{meal.time}</div>
                  <div className="meal-name">{meal.name}</div>
                  <div className="meal-nutrients">
                    {meal.calories}cal | {Math.round(meal.protein)}g protein
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
