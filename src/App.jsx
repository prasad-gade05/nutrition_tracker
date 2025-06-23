import React from "react";
import { useState } from "react";
import ManualEntryForm from "./components/ManualEntryForm";
import ImageEntry from "./components/ImageEntry";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [nutritionData, setNutritionData] = useState(null);
  const [mealsUpdated, setMealsUpdated] = useState(0);
  const [activeTab, setActiveTab] = useState("image");

  const handleNutritionReceived = (data) => {
    setNutritionData(data);
  };

  const handleMealSaved = (savedMeal) => {
    setNutritionData(null); // Clear the nutrition results display
    setMealsUpdated((prev) => prev + 1); // Trigger dashboard refresh
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>NutriSnap</h1>
        <p>AI-Powered Meal Journal</p>
      </header>

      <main>
        <div className="entry-tabs">
          <button
            className={`tab-button ${activeTab === "manual" ? "active" : ""}`}
            onClick={() => setActiveTab("manual")}
          >
            ✏️ Manual Entry
          </button>
          <button
            className={`tab-button ${activeTab === "image" ? "active" : ""}`}
            onClick={() => setActiveTab("image")}
          >
            📷 Snap a Meal
          </button>
        </div>

        {activeTab === "manual" ? (
          <ManualEntryForm
            onNutritionReceived={handleNutritionReceived}
            onMealSaved={handleMealSaved}
          />
        ) : (
          <ImageEntry
            onNutritionReceived={handleNutritionReceived}
            onMealSaved={handleMealSaved}
          />
        )}

        {nutritionData && (
          <div className="nutrition-results">
            <h3>Nutrition Results:</h3>
            <pre>{JSON.stringify(nutritionData, null, 2)}</pre>
          </div>
        )}

        <Dashboard mealsUpdated={mealsUpdated} />
      </main>
    </div>
  );
}

export default App;
