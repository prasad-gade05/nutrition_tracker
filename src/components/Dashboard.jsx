import React from "react";
import { useState, useEffect, useRef } from "react";
import {
  getMealsByDate,
  getAllMeals,
  downloadMealsCSV,
  importMealsFromCSV,
  getDailyGoals,
  setDailyGoals,
  removeDailyGoal,
} from "../utils/storage";
import { format, addDays, subDays, startOfDay } from "date-fns";
import MealDetail from "./MealDetail";
import { FaCalendarAlt, FaDownload, FaUpload } from "react-icons/fa";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Calendar.css";

const NUTRIENTS = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "sugar", label: "Sugar", unit: "g" },
  { key: "vitaminA", label: "Vitamin A", unit: "mcg" },
  { key: "vitaminC", label: "Vitamin C", unit: "mg" },
  { key: "vitaminD", label: "Vitamin D", unit: "mcg" },
  { key: "vitaminB6", label: "Vitamin B6", unit: "mg" },
  { key: "vitaminB12", label: "Vitamin B12", unit: "mcg" },
  { key: "sodium", label: "Sodium", unit: "mg" },
  { key: "iron", label: "Iron", unit: "mg" },
  { key: "calcium", label: "Calcium", unit: "mg" },
  { key: "potassium", label: "Potassium", unit: "mg" },
  { key: "magnesium", label: "Magnesium", unit: "mg" },
];

const MACRO_COLORS = ["#27ae60", "#f4d35e", "#2980b9"];
const MACRO_KEYS = ["protein", "carbs", "fat"];
const MACRO_LABELS = ["Protein", "Carbs", "Fat"];

// Secondary goals config
const SECONDARY_GOALS = [
  {
    key: "fiber",
    label: "Fiber",
    unit: "g",
    placeholder: "e.g., 25-38g",
    info: "Aids digestion. RDI: 25-38g.",
  },
  {
    key: "sugar",
    label: "Sugar",
    unit: "g",
    placeholder: "e.g., less than 25g",
    info: "Limit added sugar. RDI: <25g.",
  },
  {
    key: "sodium",
    label: "Sodium",
    unit: "mg",
    placeholder: "e.g., less than 2300mg",
    info: "Limit sodium. RDI: <2300mg.",
  },
];

// Advanced micronutrient configs
const VITAMINS = [
  {
    key: "vitaminA",
    label: "Vitamin A",
    unit: "mcg",
    info: "Vision, immunity. RDI: 700-900mcg.",
  },
  {
    key: "vitaminC",
    label: "Vitamin C",
    unit: "mg",
    info: "Immunity, antioxidant. RDI: 75-90mg.",
  },
  {
    key: "vitaminD",
    label: "Vitamin D",
    unit: "mcg",
    info: "Bone health. RDI: 15-20mcg.",
  },
  {
    key: "vitaminB6",
    label: "Vitamin B6",
    unit: "mg",
    info: "Metabolism. RDI: 1.3-2mg.",
  },
  {
    key: "vitaminB12",
    label: "Vitamin B12",
    unit: "mcg",
    info: "Nerve function. RDI: 2.4mcg.",
  },
];
const MINERALS = [
  {
    key: "sodium",
    label: "Sodium",
    unit: "mg",
    info: "Fluid balance. RDI: <2300mg.",
  },
  {
    key: "iron",
    label: "Iron",
    unit: "mg",
    info: "Blood production. RDI: 8-18mg.",
  },
  {
    key: "calcium",
    label: "Calcium",
    unit: "mg",
    info: "Bone health. RDI: 1000-1300mg.",
  },
  {
    key: "potassium",
    label: "Potassium",
    unit: "mg",
    info: "Heart, muscle. RDI: 3400-4700mg.",
  },
  {
    key: "magnesium",
    label: "Magnesium",
    unit: "mg",
    info: "Muscle, nerve. RDI: 310-420mg.",
  },
];

function getTotalForNutrient(nutrient, meals) {
  let total = 0;
  meals.forEach((meal) => {
    const n = meal.geminiAnalysis?.nutrition || {};
    if (
      ["calories", "protein", "carbs", "fat", "fiber", "sugar"].includes(
        nutrient
      )
    ) {
      total += n[nutrient]?.value || 0;
    } else if (n.vitamins && n.vitamins[nutrient]) {
      total += n.vitamins[nutrient].value || 0;
    } else if (n.minerals && n.minerals[nutrient]) {
      total += n.minerals[nutrient].value || 0;
    }
  });
  return total;
}

const Dashboard = ({ mealsUpdated }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meals, setMeals] = useState([]);
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
  });
  const [selectedMealId, setSelectedMealId] = useState(null);
  const [importFeedback, setImportFeedback] = useState(null);
  const fileInputRef = useRef(null);
  const [goals, setGoals] = useState(getDailyGoals());
  const [goalInputs, setGoalInputs] = useState(goals);
  const [calorieGoal, setCalorieGoal] = useState(goals.calories || "");
  const [macroPercents, setMacroPercents] = useState(() => {
    const p = goals.proteinPct ?? 30;
    const c = goals.carbsPct ?? 40;
    const f = goals.fatPct ?? 30;
    return { protein: p, carbs: c, fat: f };
  });

  // --- Secondary Goals State ---
  const [secondaryToggles, setSecondaryToggles] = useState(() => {
    const g = getDailyGoals();
    return Object.fromEntries(
      SECONDARY_GOALS.map((sg) => [sg.key, g[sg.key] !== undefined])
    );
  });
  const [secondaryValues, setSecondaryValues] = useState(() => {
    const g = getDailyGoals();
    return Object.fromEntries(
      SECONDARY_GOALS.map((sg) => [sg.key, g[sg.key] || ""])
    );
  });

  const handleSecondaryToggle = (key) => {
    setSecondaryToggles((t) => ({ ...t, [key]: !t[key] }));
  };
  const handleSecondaryValue = (key, value) => {
    setSecondaryValues((v) => ({ ...v, [key]: value }));
  };

  // --- Advanced Accordions State ---
  const [showVitamins, setShowVitamins] = useState(true);
  const [showMinerals, setShowMinerals] = useState(true);
  const [vitaminToggles, setVitaminToggles] = useState(() => {
    const g = getDailyGoals();
    return Object.fromEntries(
      VITAMINS.map((v) => [v.key, g[v.key] !== undefined])
    );
  });
  const [vitaminValues, setVitaminValues] = useState(() => {
    const g = getDailyGoals();
    return Object.fromEntries(VITAMINS.map((v) => [v.key, g[v.key] || ""]));
  });
  const [mineralToggles, setMineralToggles] = useState(() => {
    const g = getDailyGoals();
    return Object.fromEntries(
      MINERALS.map((m) => [m.key, g[m.key] !== undefined])
    );
  });
  const [mineralValues, setMineralValues] = useState(() => {
    const g = getDailyGoals();
    return Object.fromEntries(MINERALS.map((m) => [m.key, g[m.key] || ""]));
  });
  const handleVitaminToggle = (key) =>
    setVitaminToggles((t) => ({ ...t, [key]: !t[key] }));
  const handleVitaminValue = (key, value) =>
    setVitaminValues((v) => ({ ...v, [key]: value }));
  const handleMineralToggle = (key) =>
    setMineralToggles((t) => ({ ...t, [key]: !t[key] }));
  const handleMineralValue = (key, value) =>
    setMineralValues((v) => ({ ...v, [key]: value }));

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const toastTimeout = useRef(null);

  // Check if any goal is set (for empty state)
  const anyGoalSet = () => {
    if (calorieGoal) return true;
    if (
      Object.values(secondaryToggles).some(Boolean) &&
      Object.values(secondaryValues).some((v) => v)
    )
      return true;
    if (
      Object.values(vitaminToggles).some(Boolean) &&
      Object.values(vitaminValues).some((v) => v)
    )
      return true;
    if (
      Object.values(mineralToggles).some(Boolean) &&
      Object.values(mineralValues).some((v) => v)
    )
      return true;
    return false;
  };

  useEffect(() => {
    loadMealsForDate();
  }, [selectedDate, mealsUpdated]);

  // Add storage event listener
  useEffect(() => {
    const handleStorageChange = () => {
      loadMealsForDate();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const loadMealsForDate = () => {
    const dateMeals = getMealsByDate(selectedDate);
    setMeals(dateMeals);
    calculateDailyTotals(dateMeals);
  };

  const calculateDailyTotals = (dateMeals) => {
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
    };

    dateMeals.forEach((meal) => {
      const nutrition = meal.geminiAnalysis?.nutrition || {};

      totals.calories += nutrition.calories?.value || 0;
      totals.protein += nutrition.protein?.value || 0;
      totals.carbs += nutrition.carbs?.value || 0;
      totals.fat += nutrition.fat?.value || 0;
      totals.fiber += nutrition.fiber?.value || 0;
      totals.sugar += nutrition.sugar?.value || 0;
    });

    setDailyTotals(totals);
  };

  const navigateDate = (direction) => {
    if (direction === "prev") {
      setSelectedDate(subDays(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  const isToday = (date) => {
    return (
      format(startOfDay(date), "yyyy-MM-dd") ===
      format(startOfDay(new Date()), "yyyy-MM-dd")
    );
  };

  const getMealIcon = (type) => {
    return type === "image" ? "📷" : "✏️";
  };

  const handleMealClick = (mealId) => {
    setSelectedMealId(mealId);
  };

  const handleMealDetailClose = () => {
    setSelectedMealId(null);
  };

  const handleMealDeleted = (deletedMealId) => {
    setSelectedMealId(null);
    // Refresh the meals list
    loadMealsForDate();
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = importMealsFromCSV(e.target.result);
        if (result.success) {
          setImportFeedback({
            type: "success",
            message: `Successfully imported ${result.imported} meals. Total meals: ${result.total}`,
          });
          loadMealsForDate(); // Refresh the current view
        } else {
          setImportFeedback({
            type: "error",
            message: result.error,
          });
        }
      } catch (error) {
        setImportFeedback({
          type: "error",
          message: "Failed to import CSV. Please check the file format.",
        });
      }
      // Clear the file input
      event.target.value = "";
    };
    reader.readAsText(file);
  };

  // Clear feedback after 5 seconds
  useEffect(() => {
    if (importFeedback) {
      const timer = setTimeout(() => {
        setImportFeedback(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [importFeedback]);

  useEffect(() => {
    setGoalInputs(goals);
  }, [goals]);

  const handleGoalInputChange = (nutrient, value) => {
    const newInputs = { ...goalInputs, [nutrient]: value };
    setGoalInputs(newInputs);
  };

  const handleGoalSave = () => {
    const newGoals = {};
    const goalsToRemove = [];

    // 1. Handle calorie goal
    if (calorieGoal && !isNaN(Number(calorieGoal)) && Number(calorieGoal) > 0) {
      newGoals.calories = Number(calorieGoal);
    } else {
      goalsToRemove.push("calories");
    }

    // 2. Save macro percentages
    newGoals.proteinPct = macroPercents.protein;
    newGoals.carbsPct = macroPercents.carbs;
    newGoals.fatPct = macroPercents.fat;

    // 3. Handle secondary goals
    SECONDARY_GOALS.forEach((sg) => {
      const value = secondaryValues[sg.key];
      if (
        secondaryToggles[sg.key] &&
        value !== "" &&
        !isNaN(Number(value)) &&
        Number(value) > 0
      ) {
        newGoals[sg.key] = Number(value);
      } else {
        goalsToRemove.push(sg.key);
      }
    });

    // 4. Handle vitamin goals
    VITAMINS.forEach((v) => {
      const value = vitaminValues[v.key];
      if (
        vitaminToggles[v.key] &&
        value !== "" &&
        !isNaN(Number(value)) &&
        Number(value) > 0
      ) {
        newGoals[v.key] = Number(value);
      } else {
        goalsToRemove.push(v.key);
      }
    });

    // 5. Handle mineral goals
    MINERALS.forEach((m) => {
      const value = mineralValues[m.key];
      if (
        mineralToggles[m.key] &&
        value !== "" &&
        !isNaN(Number(value)) &&
        Number(value) > 0
      ) {
        newGoals[m.key] = Number(value);
      } else {
        goalsToRemove.push(m.key);
      }
    });

    // Save to storage
    setDailyGoals(newGoals);
    goalsToRemove.forEach((key) => removeDailyGoal(key));

    // Update component state
    setGoals(getDailyGoals());

    // Show confirmation toast
    setShowToast(true);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setShowToast(false), 2000);
  };

  const handleMacroSlider = (macro, value) => {
    value = Math.max(0, Math.min(100, value));
    let { protein, carbs, fat } = macroPercents;
    if (macro === "protein") protein = value;
    if (macro === "carbs") carbs = value;
    if (macro === "fat") fat = value;
    // Distribute the difference to the other two macros
    let total = protein + carbs + fat;
    if (total !== 100) {
      const others = MACRO_KEYS.filter((k) => k !== macro);
      const diff = total - 100;
      // Adjust the other two macros proportionally
      let o1 = macroPercents[others[0]];
      let o2 = macroPercents[others[1]];
      if (o1 + o2 === 0) {
        o1 = o2 = 50;
      }
      const o1Adj = o1 - diff * (o1 / (o1 + o2));
      const o2Adj = o2 - diff * (o2 / (o1 + o2));
      if (others[0] === "protein") protein = Math.round(o1Adj);
      if (others[0] === "carbs") carbs = Math.round(o1Adj);
      if (others[0] === "fat") fat = Math.round(o1Adj);
      if (others[1] === "protein") protein = Math.round(o2Adj);
      if (others[1] === "carbs") carbs = Math.round(o2Adj);
      if (others[1] === "fat") fat = Math.round(o2Adj);
    }
    setMacroPercents({ protein, carbs, fat });
  };

  const macroGrams = {
    protein: Math.round((calorieGoal * macroPercents.protein) / 100 / 4),
    carbs: Math.round((calorieGoal * macroPercents.carbs) / 100 / 4),
    fat: Math.round((calorieGoal * macroPercents.fat) / 100 / 9),
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Your Nutrition Dashboard</h2>
        <div className="header-content">
          <div className="header-left">
            <div
              className="calendar-container"
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                maxWidth: "260px",
              }}
            >
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                maxDate={new Date()}
                minDetail="month"
                locale="en-US"
                formatShortWeekday={(locale, date) =>
                  ["S", "M", "T", "W", "T", "F", "S"][date.getDay()]
                }
                nextLabel="›"
                next2Label="››"
                prevLabel="‹"
                prev2Label="‹‹"
              />
            </div>
            <div className="action-buttons">
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                ref={fileInputRef}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="import-btn"
                title="Import meals from CSV"
              >
                <FaUpload /> Upload Data
              </button>
              <button
                onClick={downloadMealsCSV}
                className="download-btn"
                title="Download all meal data as CSV"
              >
                <FaDownload /> Download Data
              </button>
            </div>
            {importFeedback && (
              <div className={`import-feedback ${importFeedback.type}`}>
                {importFeedback.message}
              </div>
            )}
          </div>
          <div className="header-right">
            <div className="daily-summary">
              <h3>
                Daily Summary for {format(selectedDate, "MMMM d, yyyy")}
                {isToday(selectedDate) && " (Today)"}
              </h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-value">
                    {Math.round(dailyTotals.calories)}
                  </span>
                  <span className="summary-label">Calories</span>
                </div>
                <div className="summary-item">
                  <span className="summary-value">
                    {Math.round(dailyTotals.protein)}g
                  </span>
                  <span className="summary-label">Protein</span>
                </div>
                <div className="summary-item">
                  <span className="summary-value">
                    {Math.round(dailyTotals.carbs)}g
                  </span>
                  <span className="summary-label">Carbs</span>
                </div>
                <div className="summary-item">
                  <span className="summary-value">
                    {Math.round(dailyTotals.fat)}g
                  </span>
                  <span className="summary-label">Fat</span>
                </div>
                <div className="summary-item">
                  <span className="summary-value">
                    {Math.round(dailyTotals.fiber)}g
                  </span>
                  <span className="summary-label">Fiber</span>
                </div>
                <div className="summary-item">
                  <span className="summary-value">
                    {Math.round(dailyTotals.sugar)}g
                  </span>
                  <span className="summary-label">Sugar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="meals-section">
          <h3>Meals ({meals.length})</h3>
          {meals.length === 0 ? (
            <div className="no-meals">
              <p>No meals logged for this date.</p>
              <p>Add your first meal using the tabs above!</p>
            </div>
          ) : (
            <div className="meals-grid">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="meal-card"
                  onClick={() => handleMealClick(meal.id)}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <span className="meal-icon">{getMealIcon(meal.type)}</span>
                    <div className="meal-name">
                      {meal.geminiAnalysis?.foodName || "Unknown Food"}
                    </div>
                    <div
                      className="meal-calories"
                      style={{ fontSize: "1.3rem", marginTop: 0 }}
                    >
                      {meal.geminiAnalysis?.nutrition?.calories?.value || "N/A"}{" "}
                      calories
                    </div>
                    <div className="meal-macros">
                      P:{" "}
                      {meal.geminiAnalysis?.nutrition?.protein?.value || "N/A"}g
                      &nbsp;C:{" "}
                      {meal.geminiAnalysis?.nutrition?.carbs?.value || "N/A"}g
                      &nbsp;F:{" "}
                      {meal.geminiAnalysis?.nutrition?.fat?.value || "N/A"}g
                    </div>
                    <div className="meal-time">
                      {format(
                        new Date(meal.timestamp),
                        "EEEE, MMMM d, yyyy hh:mm a"
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="daily-goals-section">
          <h3>Design Your Day: The Goal Architect</h3>
          {!anyGoalSet() && (
            <div className="goals-empty-state">
              <span role="img" aria-label="target">
                🎯
              </span>{" "}
              Ready to set your daily targets? Start with your total calorie
              goal, and we'll help with the rest.
            </div>
          )}
          <div className="goal-architect-primary">
            <div className="primary-goals-header">Primary Goals</div>
            <div className="primary-goals-calories">
              <label htmlFor="calorie-goal">Total Calories</label>
              <input
                id="calorie-goal"
                type="number"
                min="500"
                max="8000"
                placeholder="e.g., 2000"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                className="calorie-goal-input"
              />
              <span className="calorie-goal-unit">kcal</span>
            </div>
            <div className="macro-donut-row">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={MACRO_KEYS.map((k, i) => ({
                      name: MACRO_LABELS[i],
                      value: macroPercents[k],
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {MACRO_KEYS.map((k, i) => (
                      <Cell key={k} fill={MACRO_COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="macro-sliders">
                {MACRO_KEYS.map((k, i) => {
                  // Progress for today
                  const goal = macroGrams[k];
                  const today = getTotalForNutrient(k, meals);
                  const percent = goal
                    ? Math.min((today / goal) * 100, 100)
                    : 0;
                  const remaining = goal ? Math.max(goal - today, 0) : null;
                  const reached = goal && today >= goal;
                  return (
                    <div className="macro-slider-row" key={k}>
                      <label style={{ color: MACRO_COLORS[i] }}>
                        {MACRO_LABELS[i]}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={macroPercents[k]}
                        onChange={(e) =>
                          handleMacroSlider(k, Number(e.target.value))
                        }
                        className="macro-slider"
                      />
                      <span className="macro-percent">{macroPercents[k]}%</span>
                      <span className="macro-grams">
                        {goal ? `${goal}g` : "-"}
                      </span>
                      {goal && (
                        <div className="goal-progress">
                          <div className="progress-bar-bg">
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: percent + "%",
                                background: reached ? "#27ae60" : "#b7e4c7",
                              }}
                            />
                          </div>
                          <span className="goal-status">
                            {Math.round(today)} / {goal}g{" "}
                            {reached
                              ? "(Goal reached!)"
                              : `(${Math.round(remaining)} left)`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="goal-architect-secondary">
            <div className="secondary-goals-header">Supporting Cast</div>
            <div className="secondary-goals-row">
              {SECONDARY_GOALS.map((sg) => (
                <div
                  className={`goal-card${
                    secondaryToggles[sg.key] ? " enabled" : ""
                  }`}
                  key={sg.key}
                >
                  <div className="goal-card-header">
                    <span>
                      {sg.label} <span className="goal-unit">({sg.unit})</span>
                      <span className="goal-tooltip" title={sg.info}>
                        ?
                      </span>
                    </span>
                    <label className="goal-toggle">
                      <input
                        type="checkbox"
                        checked={secondaryToggles[sg.key]}
                        onChange={() => handleSecondaryToggle(sg.key)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <input
                    type="number"
                    className="goal-card-input"
                    placeholder={sg.placeholder}
                    value={secondaryValues[sg.key]}
                    onChange={(e) =>
                      handleSecondaryValue(sg.key, e.target.value)
                    }
                    disabled={!secondaryToggles[sg.key]}
                  />
                  {secondaryToggles[sg.key] &&
                    secondaryValues[sg.key] &&
                    !isNaN(Number(secondaryValues[sg.key])) &&
                    (() => {
                      const goal = Number(secondaryValues[sg.key]);
                      const today = getTotalForNutrient(sg.key, meals);
                      const percent = goal
                        ? Math.min((today / goal) * 100, 100)
                        : 0;
                      const remaining = goal ? Math.max(goal - today, 0) : null;
                      const reached = goal && today >= goal;
                      return (
                        <div className="goal-progress">
                          <div className="progress-bar-bg">
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: percent + "%",
                                background: reached ? "#27ae60" : "#b7e4c7",
                              }}
                            />
                          </div>
                          <span className="goal-status">
                            {Math.round(today)} / {goal}
                            {sg.unit}{" "}
                            {reached
                              ? "(Goal reached!)"
                              : `(${Math.round(remaining)} left)`}
                          </span>
                        </div>
                      );
                    })()}
                </div>
              ))}
            </div>
          </div>
          <div className="goal-architect-advanced">
            <div className="advanced-header">Advanced Details</div>
            <div className="accordion-group">
              <div className="accordion-item">
                <button
                  className="accordion-toggle"
                  onClick={() => setShowVitamins((v) => !v)}
                >
                  Vitamins {showVitamins ? "▲" : "▼"}
                </button>
                {showVitamins && (
                  <div className="accordion-content">
                    <div className="advanced-goals-row">
                      {VITAMINS.map((v) => (
                        <div
                          className={`goal-card${
                            vitaminToggles[v.key] ? " enabled" : ""
                          }`}
                          key={v.key}
                        >
                          <div className="goal-card-header">
                            <span>
                              {v.label}{" "}
                              <span className="goal-unit">({v.unit})</span>
                              <span className="goal-tooltip" title={v.info}>
                                ?
                              </span>
                            </span>
                            <label className="goal-toggle">
                              <input
                                type="checkbox"
                                checked={vitaminToggles[v.key]}
                                onChange={() => handleVitaminToggle(v.key)}
                              />
                              <span className="slider"></span>
                            </label>
                          </div>
                          <input
                            type="number"
                            className="goal-card-input"
                            placeholder="Set goal"
                            value={vitaminValues[v.key]}
                            onChange={(e) =>
                              handleVitaminValue(v.key, e.target.value)
                            }
                            disabled={!vitaminToggles[v.key]}
                          />
                          {vitaminToggles[v.key] &&
                            vitaminValues[v.key] &&
                            !isNaN(Number(vitaminValues[v.key])) &&
                            (() => {
                              const goal = Number(vitaminValues[v.key]);
                              const today = getTotalForNutrient(v.key, meals);
                              const percent = goal
                                ? Math.min((today / goal) * 100, 100)
                                : 0;
                              const remaining = goal
                                ? Math.max(goal - today, 0)
                                : null;
                              const reached = goal && today >= goal;
                              return (
                                <div className="goal-progress">
                                  <div className="progress-bar-bg">
                                    <div
                                      className="progress-bar-fill"
                                      style={{
                                        width: percent + "%",
                                        background: reached
                                          ? "#27ae60"
                                          : "#b7e4c7",
                                      }}
                                    />
                                  </div>
                                  <span className="goal-status">
                                    {Math.round(today)} / {goal}
                                    {v.unit}{" "}
                                    {reached
                                      ? "(Goal reached!)"
                                      : `(${Math.round(remaining)} left)`}
                                  </span>
                                </div>
                              );
                            })()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="accordion-item">
                <button
                  className="accordion-toggle"
                  onClick={() => setShowMinerals((m) => !m)}
                >
                  Minerals {showMinerals ? "▲" : "▼"}
                </button>
                {showMinerals && (
                  <div className="accordion-content">
                    <div className="advanced-goals-row">
                      {MINERALS.map((m) => (
                        <div
                          className={`goal-card${
                            mineralToggles[m.key] ? " enabled" : ""
                          }`}
                          key={m.key}
                        >
                          <div className="goal-card-header">
                            <span>
                              {m.label}{" "}
                              <span className="goal-unit">({m.unit})</span>
                              <span className="goal-tooltip" title={m.info}>
                                ?
                              </span>
                            </span>
                            <label className="goal-toggle">
                              <input
                                type="checkbox"
                                checked={mineralToggles[m.key]}
                                onChange={() => handleMineralToggle(m.key)}
                              />
                              <span className="slider"></span>
                            </label>
                          </div>
                          <input
                            type="number"
                            className="goal-card-input"
                            placeholder="Set goal"
                            value={mineralValues[m.key]}
                            onChange={(e) =>
                              handleMineralValue(m.key, e.target.value)
                            }
                            disabled={!mineralToggles[m.key]}
                          />
                          {mineralToggles[m.key] &&
                            mineralValues[m.key] &&
                            !isNaN(Number(mineralValues[m.key])) &&
                            (() => {
                              const goal = Number(mineralValues[m.key]);
                              const today = getTotalForNutrient(m.key, meals);
                              const percent = goal
                                ? Math.min((today / goal) * 100, 100)
                                : 0;
                              const remaining = goal
                                ? Math.max(goal - today, 0)
                                : null;
                              const reached = goal && today >= goal;
                              return (
                                <div className="goal-progress">
                                  <div className="progress-bar-bg">
                                    <div
                                      className="progress-bar-fill"
                                      style={{
                                        width: percent + "%",
                                        background: reached
                                          ? "#27ae60"
                                          : "#b7e4c7",
                                      }}
                                    />
                                  </div>
                                  <span className="goal-status">
                                    {Math.round(today)} / {goal}
                                    {m.unit}{" "}
                                    {reached
                                      ? "(Goal reached!)"
                                      : `(${Math.round(remaining)} left)`}
                                  </span>
                                </div>
                              );
                            })()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button (centered in card) */}
        <div className="goals-btn-row">
          <button
            className="save-goals-btn"
            onClick={handleGoalSave}
            type="button"
          >
            Save Goals
          </button>
        </div>

        {/* Toast Notification */}
        {showToast && <div className="goals-toast">✅ Goals Updated!</div>}
      </div>

      {selectedMealId && (
        <MealDetail
          mealId={selectedMealId}
          onClose={handleMealDetailClose}
          onMealDeleted={handleMealDeleted}
        />
      )}

      <style jsx>{`
        :global(.custom-calendar) {
          width: 100%;
          border: 1px solid #e6e6e6;
          border-radius: 8px;
          padding: 10px;
          background: white;
        }
        :global(.react-calendar__month-view__days__day--weekend) {
          color: inherit !important;
        }
        :global(.react-calendar__month-view__days) {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr);
        }
        :global(.react-calendar__month-view__weekdays) {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr);
        }
        :global(.react-calendar__month-view__weekdays__weekday) {
          text-align: center;
          text-transform: uppercase;
          font-weight: bold;
          font-size: 0.8em;
          padding: 0.5em;
        }
        :global(.react-calendar__month-view__days__day) {
          padding: 0.8em 0;
          text-align: center;
        }
        :global(.react-calendar__tile--active) {
          background: #22c55e !important;
          color: white;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
