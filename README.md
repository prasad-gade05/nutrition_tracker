# NutriSnap: AI-Powered Meal Journal - [Demo](https://prasadsnutritiontracker.netlify.app/)

A simple, private, and intelligent application for tracking your daily nutritional intake. NutriSnap uses the Google Gemini API to analyze your meals from either an image or a text description, providing a detailed nutritional breakdown without the need for manual database lookups.

## Features

- **📷 Image Analysis**: Take a photo of your meal and get instant nutritional analysis
- **✏️ Manual Entry**: Describe your food and get detailed nutritional information
- **📊 Daily Dashboard**: View your daily nutrition summary and meal history
- **📱 Mobile-Friendly**: Responsive design that works on desktop and mobile
- **🔒 Privacy-First**: All data stored locally on your device
- **📅 Date Navigation**: Browse your meal history by date
- **🗑️ Meal Management**: View detailed meal information and delete entries

## Technology Stack

- **Frontend**: React (Vite)
- **AI Integration**: Google Gemini API (Vision & Text models)
- **Data Storage**: Browser Local Storage
- **Styling**: CSS with responsive design
- **Date Handling**: date-fns
- **Unique IDs**: uuid

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- Google Gemini API key

### Installation

1. Clone or download this repository
2. Navigate to the project directory:

   ```bash
   cd nutrisnap
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Configure your Gemini API key:

   - Open `src/services/geminiService.js`
   - Replace `'YOUR_GEMINI_API_KEY'` with your actual API key
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5173`

## How to Use

### Adding Meals

#### Manual Entry

1. Click on the "✏️ Manual Entry" tab
2. Enter the food name/description (e.g., "Grilled salmon with asparagus")
3. Enter the quantity/serving size (e.g., "1 serving", "200g", "1 cup")
4. Click "Get Nutrition"
5. Review the AI-generated nutritional data
6. Edit the food name if needed
7. Click "Log Meal" to save

#### Image Analysis

1. Click on the "📷 Snap a Meal" tab
2. Choose "Take Photo" to use your camera or "Select from Gallery" to choose an existing image
3. Wait for the AI to analyze your image
4. Review the nutritional data
5. Edit the food name if needed
6. Click "Log Meal" to save

### Viewing Your Data

- **Daily Summary**: See your total calories, protein, carbs, and fat for the selected date
- **Date Navigation**: Use the arrow buttons to browse different dates
- **Meal Cards**: Click on any meal card to view detailed information
- **Meal Details**: View full nutritional breakdown, including vitamins and minerals
- **Delete Meals**: Remove unwanted entries from the meal detail view

## Data Storage

All your meal data is stored locally in your browser's Local Storage under the key `nutrisnap_meals`. This means:

- ✅ Your data stays private and on your device
- ✅ No server dependencies
- ✅ Works offline
- ⚠️ Data is tied to your browser/device
- ⚠️ Clearing browser data will remove your meals

## API Configuration

The application uses Google's Gemini API for nutritional analysis. You'll need to:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Replace the placeholder in `src/services/geminiService.js`

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## Mobile Usage

NutriSnap is designed to work on mobile devices:

- **Camera Access**: The app can access your device camera for taking photos
- **Responsive Design**: The interface adapts to different screen sizes
- **Touch-Friendly**: All buttons and interactions are optimized for touch

## Troubleshooting

### API Errors

- Ensure your Gemini API key is correctly set
- Check your internet connection
- Verify the API key has the necessary permissions

### Image Issues

- Ensure the image is clear and well-lit
- Try cropping the image to focus on the food
- Check that the image format is supported (JPEG, PNG)

### Data Loss

- Local Storage data is tied to your browser
- Don't clear browser data if you want to keep your meals
- Consider exporting your data regularly

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.jsx    # Main dashboard view
│   ├── ImageEntry.jsx   # Image analysis component
│   ├── ManualEntryForm.jsx # Manual entry form
│   ├── MealDetail.jsx   # Meal detail view
│   └── ReviewScreen.jsx # Nutrition review screen
├── services/            # API services
│   └── geminiService.js # Gemini API integration
├── utils/               # Utility functions
│   └── storage.js       # Local Storage operations
├── App.jsx              # Main app component
├── App.css              # Main styles
└── main.js              # App entry point
```

### Key Features Implemented

1. **Milestone 1**: Core AI Logic & Manual Entry
2. **Milestone 2**: Data Storage & Persistence
3. **Milestone 3**: Image-Based Meal Analysis
4. **Milestone 4**: Review & Confirmation Screen
5. **Milestone 5**: Dashboard & UI Polish
6. **Milestone 6**: Meal Detail View & Management
7. **Milestone 7**: Final Polish & Responsive Design

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please check the troubleshooting section above or create an issue in the project repository.
