import {
  startOfDay,
  endOfDay,
  isWithinInterval,
  eachDayOfInterval,
  format,
} from "date-fns";
import { getAllMeals } from "./storage";

// Get all meals in a date range (inclusive)
export function getMealsInRange(startDate, endDate) {
  const allMeals = getAllMeals();
  return allMeals.filter((meal) => {
    const ts = meal.timestamp;
    return (
      ts >= startOfDay(startDate).getTime() && ts <= endOfDay(endDate).getTime()
    );
  });
}

// Get daily totals for calories and macros for a date range
export function getDailyTotals(startDate, endDate) {
  const days = eachDayOfInterval({
    start: startOfDay(startDate),
    end: endOfDay(endDate),
  });
  const meals = getMealsInRange(startDate, endDate);
  return days.map((day) => {
    const dayMeals = meals.filter((meal) => {
      const ts = meal.timestamp;
      return isWithinInterval(new Date(ts), {
        start: startOfDay(day),
        end: endOfDay(day),
      });
    });
    let calories = 0,
      protein = 0,
      carbs = 0,
      fat = 0;
    dayMeals.forEach((meal) => {
      const n = meal.geminiAnalysis?.nutrition || {};
      calories += n.calories?.value || 0;
      protein += n.protein?.value || 0;
      carbs += n.carbs?.value || 0;
      fat += n.fat?.value || 0;
    });
    return {
      date: format(day, "yyyy-MM-dd"),
      calories,
      protein,
      carbs,
      fat,
    };
  });
}

// Get average macro breakdown (as % of calories) for a date range
export function getMacroAverages(startDate, endDate) {
  const daily = getDailyTotals(startDate, endDate);
  let totalCalories = 0,
    totalProtein = 0,
    totalCarbs = 0,
    totalFat = 0;
  daily.forEach((day) => {
    totalCalories += day.calories;
    totalProtein += day.protein;
    totalCarbs += day.carbs;
    totalFat += day.fat;
  });
  // 1g protein = 4 kcal, 1g carb = 4 kcal, 1g fat = 9 kcal
  const proteinCals = totalProtein * 4;
  const carbCals = totalCarbs * 4;
  const fatCals = totalFat * 9;
  const sumCals = proteinCals + carbCals + fatCals;
  return {
    protein: sumCals ? (proteinCals / sumCals) * 100 : 0,
    carbs: sumCals ? (carbCals / sumCals) * 100 : 0,
    fat: sumCals ? (fatCals / sumCals) * 100 : 0,
    avgProtein: daily.length ? totalProtein / daily.length : 0,
    avgCarbs: daily.length ? totalCarbs / daily.length : 0,
    avgFat: daily.length ? totalFat / daily.length : 0,
  };
}

// Get stacked macro data for bar chart
export function getStackedMacros(startDate, endDate) {
  return getDailyTotals(startDate, endDate).map((day) => ({
    date: day.date,
    protein: day.protein * 4, // kcal
    carbs: day.carbs * 4, // kcal
    fat: day.fat * 9, // kcal
    calories: day.calories,
  }));
}

// Get trend for any nutrient (by key) over date range
export function getNutrientTrend(startDate, endDate, nutrientKey) {
  const days = eachDayOfInterval({
    start: startOfDay(startDate),
    end: endOfDay(endDate),
  });
  const meals = getMealsInRange(startDate, endDate);
  return days.map((day) => {
    const dayMeals = meals.filter((meal) => {
      const ts = meal.timestamp;
      return isWithinInterval(new Date(ts), {
        start: startOfDay(day),
        end: endOfDay(day),
      });
    });
    let value = 0;
    dayMeals.forEach((meal) => {
      const n = meal.geminiAnalysis?.nutrition || {};
      if (nutrientKey === "calories") value += n.calories?.value || 0;
      else if (nutrientKey === "protein") value += n.protein?.value || 0;
      else if (nutrientKey === "carbs") value += n.carbs?.value || 0;
      else if (nutrientKey === "fat") value += n.fat?.value || 0;
      else if (nutrientKey === "fiber") value += n.fiber?.value || 0;
      else if (nutrientKey === "sugar") value += n.sugar?.value || 0;
      else if (n.vitamins && n.vitamins[nutrientKey])
        value += n.vitamins[nutrientKey].value || 0;
      else if (n.minerals && n.minerals[nutrientKey])
        value += n.minerals[nutrientKey].value || 0;
    });
    return {
      date: format(day, "yyyy-MM-dd"),
      value,
    };
  });
}

// Get data for calendar heatmap (past 6 months)
export function getHeatmapData() {
  const allMeals = getAllMeals();
  const today = startOfDay(new Date());
  const start = startOfDay(
    new Date(today.getFullYear(), today.getMonth() - 5, 1)
  );
  const days = eachDayOfInterval({ start, end: today });
  const map = {};
  days.forEach((day) => {
    map[format(day, "yyyy-MM-dd")] = 0;
  });
  allMeals.forEach((meal) => {
    const d = format(startOfDay(new Date(meal.timestamp)), "yyyy-MM-dd");
    const n = meal.geminiAnalysis?.nutrition || {};
    map[d] = (map[d] || 0) + (n.calories?.value || 0);
  });
  return days.map((day) => ({
    date: format(day, "yyyy-MM-dd"),
    count: map[format(day, "yyyy-MM-dd")] || 0,
  }));
}
