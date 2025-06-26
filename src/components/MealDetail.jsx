import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { getAllMeals, deleteMeal } from "../utils/storage";
import { format } from "date-fns";

const MealDetail = ({ mealId, onClose, onMealDeleted }) => {
  const [meal, setMeal] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const loadMeal = () => {
      const allMeals = getAllMeals();
      const foundMeal = allMeals.find((m) => m.id === mealId);
      setMeal(foundMeal);
    };

    loadMeal();
  }, [mealId]);

  // Click outside to close
  const handleOverlayClick = (e) => {
    if (cardRef.current && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelete = () => {
    if (meal) {
      deleteMeal(meal.id);
      if (onMealDeleted) {
        onMealDeleted(meal.id);
      }
      onClose();
    }
  };

  if (!meal) {
    return (
      <div className="meal-detail-overlay" onClick={handleOverlayClick}>
        <div className="meal-detail" ref={cardRef}>
          <div className="meal-detail-content">
            <p>Meal not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const nutrition = meal.geminiAnalysis?.nutrition || {};

  return (
    <div className="meal-detail-overlay" onClick={handleOverlayClick}>
      <div className="meal-detail" ref={cardRef}>
        <div className="meal-detail-header">
          <h2>Meal Details</h2>
        </div>

        <div className="meal-detail-content">
          <div className="meal-info">
            <div className="meal-header-info">
              <h3>{meal.geminiAnalysis?.foodName || "Unknown Food"}</h3>
              {meal.geminiAnalysis?.quantity && (
                <div className="meal-quantity">
                  Quantity: {meal.geminiAnalysis.quantity}
                </div>
              )}
              {/* Items breakdown section */}
              {Array.isArray(meal.geminiAnalysis?.items) &&
                meal.geminiAnalysis.items.length > 0 && (
                  <div
                    className="items-breakdown-section"
                    style={{ marginTop: 8, marginBottom: 8 }}
                  >
                    <strong>Identified Items:</strong>
                    <table className="items-breakdown-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Quantity</th>
                          <th>Estimated Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meal.geminiAnalysis.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.name || "-"}</td>
                            <td>{item.quantity || "-"}</td>
                            <td>{item.estimatedWeight || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              <div className="meal-meta">
                <span className="meal-type-badge">
                  {meal.type === "image"
                    ? "📷 Image Analysis"
                    : "✏️ Manual Entry"}
                </span>
                <span className="meal-time">
                  {format(
                    new Date(meal.timestamp),
                    "EEEE, MMMM d, yyyy hh:mm a"
                  )}
                </span>
              </div>
            </div>

            {meal.userInput?.image && (
              <div className="meal-image">
                <img src={meal.userInput.image} alt="Meal" />
              </div>
            )}

            {meal.userInput?.text && (
              <div className="user-input">
                <h4>Your Input:</h4>
                <p>
                  <strong>Description:</strong> {meal.userInput.text}
                </p>
                {meal.userInput.quantity && (
                  <p>
                    <strong>Quantity:</strong> {meal.userInput.quantity}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="nutrition-details">
            <h3>Nutritional Information</h3>

            <div className="nutrition-summary">
              <div className="main-nutrients">
                <div className="nutrient-item">
                  <span className="nutrient-label">Calories</span>
                  <span className="nutrient-value">
                    {nutrition.calories?.value || "N/A"}
                  </span>
                </div>
                <div className="nutrient-item">
                  <span className="nutrient-label">Protein</span>
                  <span className="nutrient-value">
                    {nutrition.protein?.value || "N/A"}{" "}
                    {nutrition.protein?.unit || ""}
                  </span>
                </div>
                <div className="nutrient-item">
                  <span className="nutrient-label">Carbohydrates</span>
                  <span className="nutrient-value">
                    {nutrition.carbs?.value || "N/A"}{" "}
                    {nutrition.carbs?.unit || ""}
                  </span>
                </div>
                <div className="nutrient-item">
                  <span className="nutrient-label">Fat</span>
                  <span className="nutrient-value">
                    {nutrition.fat?.value || "N/A"} {nutrition.fat?.unit || ""}
                  </span>
                </div>
              </div>

              {(nutrition.fiber || nutrition.sugar) && (
                <div className="other-nutrients">
                  <h4>Other Nutrients</h4>
                  <div className="nutrient-grid">
                    {nutrition.fiber && (
                      <div className="nutrient-item">
                        <span className="nutrient-label">Fiber</span>
                        <span className="nutrient-value">
                          {nutrition.fiber.value} {nutrition.fiber.unit}
                        </span>
                      </div>
                    )}
                    {nutrition.sugar && (
                      <div className="nutrient-item">
                        <span className="nutrient-label">Sugar</span>
                        <span className="nutrient-value">
                          {nutrition.sugar.value} {nutrition.sugar.unit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {nutrition.vitamins &&
                Object.keys(nutrition.vitamins).length > 0 && (
                  <div className="vitamins-section">
                    <h4>Vitamins</h4>
                    <div className="nutrient-grid">
                      {Object.entries(nutrition.vitamins).map(
                        ([vitamin, data]) => (
                          <div key={vitamin} className="nutrient-item">
                            <span className="nutrient-label">{vitamin}</span>
                            <span className="nutrient-value">
                              {data.value} {data.unit}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {nutrition.minerals &&
                Object.keys(nutrition.minerals).length > 0 && (
                  <div className="minerals-section">
                    <h4>Minerals</h4>
                    <div className="nutrient-grid">
                      {Object.entries(nutrition.minerals).map(
                        ([mineral, data]) => (
                          <div key={mineral} className="nutrient-item">
                            <span className="nutrient-label">{mineral}</span>
                            <span className="nutrient-value">
                              {data.value} {data.unit}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="meal-actions">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="delete-btn"
            >
              🗑️ Delete Entry
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="delete-confirmation">
              <div className="confirmation-content">
                <h4>Delete Meal?</h4>
                <p>
                  Are you sure you want to delete this meal? This action cannot
                  be undone.
                </p>
                <div className="confirmation-actions">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button onClick={handleDelete} className="confirm-delete-btn">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealDetail;

<style jsx>{`
  .items-breakdown-table {
    width: 100%;
    max-width: 520px;
    border-collapse: collapse;
    margin-top: 8px;
    font-size: 1rem;
  }
  .items-breakdown-table th,
  .items-breakdown-table td {
    text-align: left;
    padding: 4px 8px;
    border-bottom: 1px solid #e2e8f0;
    font-weight: 400;
  }
  .items-breakdown-table th {
    color: #475569;
    font-weight: 600;
    background: #f8fafc;
    font-size: 0.97rem;
  }
  .items-breakdown-table tr:last-child td {
    border-bottom: none;
  }
`}</style>;
