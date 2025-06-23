import React from "react";
import { useState } from "react";
import { saveMeal } from "../utils/storage";

const ReviewScreen = ({
  nutritionData,
  mealType,
  userInput,
  onConfirm,
  onCancel,
}) => {
  const [editedFoodName, setEditedFoodName] = useState(
    nutritionData?.foodName || ""
  );
  const [showFullDetails, setShowFullDetails] = useState(false);

  const handleConfirm = () => {
    const mealData = {
      type: mealType,
      userInput: userInput,
      geminiAnalysis: {
        ...nutritionData,
        foodName: editedFoodName,
      },
    };

    const savedMeal = saveMeal(mealData);
    onConfirm(savedMeal);
  };

  const nutrition = nutritionData?.nutrition || {};

  return (
    <div className="review-screen">
      <h2>Review Your Meal</h2>

      <div className="review-content">
        <div className="food-name-section">
          <label htmlFor="foodName">Food Name:</label>
          <input
            type="text"
            id="foodName"
            value={editedFoodName}
            onChange={(e) => setEditedFoodName(e.target.value)}
            className="food-name-input"
          />
        </div>

        <div className="nutrition-summary">
          <h3>Nutrition Summary</h3>
          <div className="macro-grid">
            <div className="macro-item">
              <span className="macro-label">Calories</span>
              <span className="macro-value">
                {nutrition.calories?.value || "N/A"}
              </span>
            </div>
            <div className="macro-item">
              <span className="macro-label">Protein</span>
              <span className="macro-value">
                {nutrition.protein?.value || "N/A"}{" "}
                {nutrition.protein?.unit || ""}
              </span>
            </div>
            <div className="macro-item">
              <span className="macro-label">Carbs</span>
              <span className="macro-value">
                {nutrition.carbs?.value || "N/A"} {nutrition.carbs?.unit || ""}
              </span>
            </div>
            <div className="macro-item">
              <span className="macro-label">Fat</span>
              <span className="macro-value">
                {nutrition.fat?.value || "N/A"} {nutrition.fat?.unit || ""}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowFullDetails(!showFullDetails)}
            className="details-toggle"
          >
            {showFullDetails ? "Hide Full Details" : "View Full Details"}
          </button>

          {showFullDetails && (
            <div className="full-details">
              <div className="detail-section">
                <h4>Other Nutrients</h4>
                <div className="detail-grid">
                  {nutrition.fiber && (
                    <div className="detail-item">
                      <span>Fiber:</span>
                      <span>
                        {nutrition.fiber.value} {nutrition.fiber.unit}
                      </span>
                    </div>
                  )}
                  {nutrition.sugar && (
                    <div className="detail-item">
                      <span>Sugar:</span>
                      <span>
                        {nutrition.sugar.value} {nutrition.sugar.unit}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {nutrition.vitamins &&
                Object.keys(nutrition.vitamins).length > 0 && (
                  <div className="detail-section">
                    <h4>Vitamins</h4>
                    <div className="detail-grid">
                      {Object.entries(nutrition.vitamins).map(
                        ([vitamin, data]) => (
                          <div key={vitamin} className="detail-item">
                            <span>{vitamin}:</span>
                            <span>
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
                  <div className="detail-section">
                    <h4>Minerals</h4>
                    <div className="detail-grid">
                      {Object.entries(nutrition.minerals).map(
                        ([mineral, data]) => (
                          <div key={mineral} className="detail-item">
                            <span>{mineral}:</span>
                            <span>
                              {data.value} {data.unit}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="review-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} className="confirm-btn">
            Log Meal
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewScreen;
