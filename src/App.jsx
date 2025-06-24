import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { FaSun, FaMoon } from "react-icons/fa";
import ManualEntryForm from "./components/ManualEntryForm";
import ImageEntry from "./components/ImageEntry";
import Dashboard from "./components/Dashboard";
import TrendsDashboard from "./components/TrendsDashboard";
import "./App.css";

function App() {
  const [nutritionData, setNutritionData] = useState(null);
  const [mealsUpdated, setMealsUpdated] = useState(0);
  const [activeTab, setActiveTab] = useState("image");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("nutrisnap_theme") || "light"
  );

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("nutrisnap_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleNutritionReceived = (data) => {
    setNutritionData(data);
  };

  const handleMealSaved = (savedMeal) => {
    setNutritionData(null); // Clear the nutrition results display
    setMealsUpdated((prev) => prev + 1); // Trigger dashboard refresh
  };

  return (
    <BrowserRouter>
      <div className="App">
        <header className="App-header" style={{ position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            <img
              src="/logo.png"
              alt="NutriSnap Logo"
              style={{ height: "50px", borderRadius: "12px" }}
            />
            <div style={{ textAlign: "left" }}>
              <h1>NutriSnap</h1>
              <p>AI-Powered Meal Journal</p>
            </div>
          </div>
          <button
            className={`theme-switcher${theme === "dark" ? " dark" : ""}`}
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            type="button"
          >
            <span className="switch-track">
              <span className="switch-thumb" />
            </span>
            <span className="switch-label">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </button>
        </header>

        <nav className="main-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/trends"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Trends
          </NavLink>
        </nav>

        <main>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <div className="entry-tabs">
                    <button
                      className={`tab-button ${
                        activeTab === "manual" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("manual")}
                    >
                      ✏️ Manual Entry
                    </button>
                    <button
                      className={`tab-button ${
                        activeTab === "image" ? "active" : ""
                      }`}
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

                  <Dashboard mealsUpdated={mealsUpdated} />

                  {nutritionData && (
                    <div className="nutrition-results">
                      <h3>Nutrition Results:</h3>
                      <pre>{JSON.stringify(nutritionData, null, 2)}</pre>
                    </div>
                  )}
                </>
              }
            />
            <Route path="/trends" element={<TrendsDashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
