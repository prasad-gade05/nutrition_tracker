import { useState, useEffect } from "react";
import { getAllMeals } from "../utils/storage";
import { format } from "date-fns";

const MealList = () => {
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    const loadMeals = () => {
      const allMeals = getAllMeals();
      setMeals(allMeals);
    };

    loadMeals();

    // Listen for storage changes (in case another tab updates the data)
    const handleStorageChange = () => {
      loadMeals();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (meals.length === 0) {
    return (
      <div className="meal-list">
        <h2>Your Meals</h2>
        <p>No meals logged yet. Add your first meal above!</p>
      </div>
    );
  }

  return (
    <div className="meal-list">
      <h2>Your Meals ({meals.length})</h2>
      <div className="meals-container">
        {meals.map((meal) => (
          <div key={meal.id} className="meal-item">
            <div className="meal-header">
              <h3>{meal.geminiAnalysis?.foodName || "Unknown Food"}</h3>
              <span className="meal-time">
                {format(new Date(meal.timestamp), "MMM dd, yyyy HH:mm")}
              </span>
            </div>
            <div className="meal-type">
              Type: {meal.type === "image" ? "📷 Image" : "✏️ Manual"}
            </div>
            <div className="meal-calories">
              Calories:{" "}
              {meal.geminiAnalysis?.nutrition?.calories?.value || "N/A"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealList;
