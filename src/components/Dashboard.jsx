import React from "react";
import { useState, useEffect } from "react";
import { getMealsByDate, getAllMeals } from "../utils/storage";
import { format, addDays, subDays, startOfDay } from "date-fns";
import MealDetail from "./MealDetail";
import { FaCalendarAlt } from "react-icons/fa";

const Dashboard = ({ mealsUpdated }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meals, setMeals] = useState([]);
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [selectedMealId, setSelectedMealId] = useState(null);

  useEffect(() => {
    loadMealsForDate();
  }, [selectedDate, mealsUpdated]);

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
    };

    dateMeals.forEach((meal) => {
      const nutrition = meal.geminiAnalysis?.nutrition || {};

      totals.calories += nutrition.calories?.value || 0;
      totals.protein += nutrition.protein?.value || 0;
      totals.carbs += nutrition.carbs?.value || 0;
      totals.fat += nutrition.fat?.value || 0;
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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Your Nutrition Dashboard</h2>
        <div className="date-navigation">
          <span
            style={{
              display: "flex",
              alignItems: "center",
              background: "#fff",
              borderRadius: 8,
              padding: "6px 16px",
              boxShadow: "0 2px 8px rgba(44,62,80,0.04)",
              fontWeight: 600,
            }}
          >
            <FaCalendarAlt
              style={{ color: "#2ECC71", marginRight: 8, fontSize: 18 }}
            />
            <input
              type="date"
              className="calendar-input"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              max={format(new Date(), "yyyy-MM-dd")}
              style={{
                border: "none",
                background: "transparent",
                fontWeight: 600,
                fontSize: "1.1rem",
                color: "#2C3E50",
                outline: "none",
              }}
            />
          </span>
        </div>
      </div>

      <div className="daily-summary">
        <h3>Daily Summary</h3>
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
        </div>
      </div>

      <div className="meals-section">
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#596A7A",
            marginBottom: 12,
          }}
        >
          Meals ({meals.length})
        </h3>
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
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "stretch",
                  height: "180px",
                }}
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
                  <div className="meal-macros">
                    P: {meal.geminiAnalysis?.nutrition?.protein?.value || "N/A"}
                    g &nbsp;C:{" "}
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
                <div
                  style={{
                    minWidth: 120,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "flex-end",
                    height: "100%",
                  }}
                >
                  <div
                    className="meal-calories"
                    style={{ fontSize: "1.3rem", marginTop: 0 }}
                  >
                    {meal.geminiAnalysis?.nutrition?.calories?.value || "N/A"}{" "}
                    calories
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMealId && (
        <MealDetail
          mealId={selectedMealId}
          onClose={handleMealDetailClose}
          onMealDeleted={handleMealDeleted}
        />
      )}
    </div>
  );
};

export default Dashboard;
