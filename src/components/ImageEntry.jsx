import React from "react";
import { useState, useRef } from "react";
import { getNutritionFromImage } from "../services/geminiService";
import ReviewScreen from "./ReviewScreen";

const ImageEntry = ({ onNutritionReceived, onMealSaved }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [nutritionData, setNutritionData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const maxSize = 1024;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const resizedImage = canvas.toDataURL("image/jpeg", 0.8);
        resolve(resizedImage);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);

      // Resize and convert to base64
      const resizedImage = await resizeImage(file);
      setSelectedImage(resizedImage);

      // Get nutrition from Gemini
      const data = await getNutritionFromImage(resizedImage);
      console.log("Nutrition data received:", data);

      setNutritionData(data);
      setShowReview(true);
      onNutritionReceived(data);
    } catch (err) {
      console.error("Error processing image:", err);
      setError("Failed to analyze image. Please try again.");
      setPreviewImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewConfirm = (savedMeal) => {
    setShowReview(false);
    setNutritionData(null);
    setPreviewImage(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (onMealSaved) {
      onMealSaved(savedMeal);
    }
  };

  const handleReviewCancel = () => {
    setShowReview(false);
    setNutritionData(null);
    setPreviewImage(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
      fileInputRef.current.click();
    }
  };

  const handleSelectFromGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  };

  if (showReview) {
    return (
      <ReviewScreen
        nutritionData={nutritionData}
        mealType="image"
        userInput={{
          image: selectedImage,
        }}
        onConfirm={handleReviewConfirm}
        onCancel={handleReviewCancel}
      />
    );
  }

  return (
    <div className="image-entry-form">
      <h2>Snap a Meal</h2>

      <div className="image-options">
        <button
          type="button"
          onClick={handleTakePhoto}
          disabled={isLoading}
          className="photo-btn"
        >
          📷 Take Photo
        </button>

        <button
          type="button"
          onClick={handleSelectFromGallery}
          disabled={isLoading}
          className="gallery-btn"
        >
          🖼️ Select from Gallery
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        style={{ display: "none" }}
      />

      {previewImage && (
        <div className="image-preview">
          <img src={previewImage} alt="Preview" />
          {isLoading && <div className="loading-overlay">Analyzing...</div>}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {isLoading && !previewImage && (
        <div className="loading-message">Processing image...</div>
      )}
    </div>
  );
};

export default ImageEntry;
