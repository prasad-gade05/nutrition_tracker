import React from "react";
import { useState } from "react";
import { getNutritionFromText } from "../services/geminiService";
import ReviewScreen from "./ReviewScreen";

const ManualEntryForm = ({ onNutritionReceived, onMealSaved }) => {
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [nutritionData, setNutritionData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim() || !quantity.trim()) {
      setError("Please fill in both food description and quantity");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await getNutritionFromText(description, quantity);
      console.log("Nutrition data received:", data);

      setNutritionData(data);
      setShowReview(true);
      onNutritionReceived(data);
    } catch (err) {
      console.error("Error getting nutrition:", err);
      setError("Failed to get nutritional information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewConfirm = (savedMeal) => {
    setShowReview(false);
    setNutritionData(null);
    setDescription("");
    setQuantity("");

    if (onMealSaved) {
      onMealSaved(savedMeal);
    }
  };

  const handleReviewCancel = () => {
    setShowReview(false);
    setNutritionData(null);
  };

  if (showReview) {
    return (
      <ReviewScreen
        nutritionData={nutritionData}
        mealType="manual"
        userInput={{
          text: description,
          quantity: quantity,
        }}
        onConfirm={handleReviewConfirm}
        onCancel={handleReviewCancel}
      />
    );
  }

  return (
    <div className="manual-entry-form">
      <h2>Manual Entry</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="description">Food Name/Description:</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Grilled salmon with asparagus"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="quantity">Quantity/Serving Size:</label>
          <input
            type="text"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g., 1 serving, 200g, 1 cup"
            disabled={isLoading}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Getting Nutrition..." : "Get Nutrition"}
        </button>
      </form>
    </div>
  );
};

export default ManualEntryForm;
