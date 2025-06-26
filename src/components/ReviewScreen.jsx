import React from "react";
import { useState } from "react";
import { saveMeal } from "../utils/storage";

const ReviewScreen = ({
  nutritionData,
  mealType,
  userInput,
  onConfirm,
  onCancel,
  onRecheck,
}) => {
  const [editedFoodName, setEditedFoodName] = useState(
    nutritionData?.foodName || ""
  );
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [showSuggestionInput, setShowSuggestionInput] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [recheckLoading, setRecheckLoading] = useState(false);
  const [recheckError, setRecheckError] = useState("");

  const handleConfirm = () => {
    const mealData = {
      type: mealType,
      userInput: userInput,
      geminiAnalysis: {
        ...nutritionData,
        foodName: editedFoodName,
        quantity: nutritionData?.quantity || "",
      },
    };

    const savedMeal = saveMeal(mealData);
    onConfirm(savedMeal);
  };

  const handleRecheck = async () => {
    if (!suggestion.trim()) return;
    setRecheckLoading(true);
    setRecheckError("");
    try {
      await onRecheck(suggestion);
      setShowSuggestionInput(false);
      setSuggestion("");
    } catch (err) {
      setRecheckError(err.message || "Failed to recheck. Try again.");
    } finally {
      setRecheckLoading(false);
    }
  };

  const nutrition = nutritionData?.nutrition || {};
  const quantity = nutritionData?.quantity;
  const items = nutritionData?.items || [];

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

        {/* Show Gemini's item breakdown if present */}
        {items.length > 0 && (
          <div className="items-breakdown-section">
            <strong>Identified Items:</strong>
            <div className="items-breakdown-grid">
              <div className="items-header-row">
                <span className="item-header">Name</span>
                <span className="item-header">Quantity</span>
                <span className="item-header">Estimated Weight</span>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="item-detail-row">
                  <span className="item-value">{item.name || "-"}</span>
                  <span className="item-value">{item.quantity || "-"}</span>
                  <span className="item-value">
                    {item.estimatedWeight || "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show Gemini's quantity result, only for review */}
        {quantity && (
          <div className="quantity-section">
            <strong>Estimated Quantity:</strong> {quantity}
          </div>
        )}

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
          <button
            type="button"
            className="recheck-btn"
            onClick={() => setShowSuggestionInput(true)}
          >
            Recheck with Suggestion
          </button>
        </div>

        {showSuggestionInput && (
          <div className="suggestion-modal">
            <div className="suggestion-content">
              <h4>Suggest Quantity/Correction</h4>
              <input
                type="text"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="e.g., There are 3 rotis and 1 bowl of dal"
                disabled={recheckLoading}
                className="suggestion-input"
              />
              {recheckError && (
                <div className="error-message">{recheckError}</div>
              )}
              <div className="suggestion-actions">
                <button
                  type="button"
                  onClick={() => setShowSuggestionInput(false)}
                  className="cancel-btn"
                  disabled={recheckLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRecheck}
                  className="confirm-btn"
                  disabled={recheckLoading || !suggestion.trim()}
                >
                  {recheckLoading ? "Rechecking..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .items-breakdown-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
          margin-top: 8px;
          width: 100%;
          max-width: 520px;
        }
        .items-header-row {
          display: grid;
          grid-template-columns: 2.2fr 1.5fr 1.7fr;
          font-size: 0.97rem;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 2px;
          padding-bottom: 2px;
          border-bottom: 1px solid #e2e8f0;
        }
        .item-detail-row {
          display: grid;
          grid-template-columns: 2.2fr 1.5fr 1.7fr;
          font-size: 1.01rem;
          color: #222;
          font-weight: 400;
          padding: 2px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .item-header {
          padding-right: 8px;
          font-weight: 600;
          color: #475569;
        }
        .item-value {
          padding-right: 8px;
          color: #222;
          font-weight: 400;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
};

export default ReviewScreen;
