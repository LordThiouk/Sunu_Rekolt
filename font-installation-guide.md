# How to Install Baloo Bhai 2 Font in Your Expo Project

To make the "Baloo Bhai 2" font work in your app, you need to follow these steps:

## Step 1: Download the Font

1. Download the Baloo Bhai 2 font from Google Fonts:
   https://fonts.google.com/specimen/Baloo+Bhai+2

2. Extract the font files and select the weights you need (Regular, Medium, SemiBold, Bold)

## Step 2: Add Font Files to Your Project

1. Create a `/assets/fonts/` directory in your project if it doesn't already exist
2. Copy the font files to this directory
   - Rename the files to remove spaces, for example: `BalooBhai2-Regular.ttf`, `BalooBhai2-Medium.ttf`, etc.

## Step 3: Configure Expo to Use the Fonts

### Option 1: Using app.json (simpler)

Add this to your `app.json` file:

```json
{
  "expo": {
    // ... other configurations
    "fonts": [
      {
        "asset": "./assets/fonts/BalooBhai2-Regular.ttf",
        "fontFamily": "BalooBhai2-Regular"
      },
      {
        "asset": "./assets/fonts/BalooBhai2-Medium.ttf",
        "fontFamily": "BalooBhai2-Medium"
      },
      {
        "asset": "./assets/fonts/BalooBhai2-SemiBold.ttf",
        "fontFamily": "BalooBhai2-SemiBold"
      },
      {
        "asset": "./assets/fonts/BalooBhai2-Bold.ttf",
        "fontFamily": "BalooBhai2-Bold"
      }
    ]
  }
}
```

### Option 2: Load Fonts Programmatically (current project approach)

Since your project is already using `expo-font` with `useFonts` hook, modify your `app/_layout.tsx` file:

```javascript
// Import additional dependencies if needed
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Add the Baloo Bhai 2 fonts:
    'BalooBhai2-Regular': require('../assets/fonts/BalooBhai2-Regular.ttf'),
    'BalooBhai2-Medium': require('../assets/fonts/BalooBhai2-Medium.ttf'),
    'BalooBhai2-SemiBold': require('../assets/fonts/BalooBhai2-SemiBold.ttf'),
    'BalooBhai2-Bold': require('../assets/fonts/BalooBhai2-Bold.ttf'),
  });
  
  // Rest of your component...
}
```

## Step 4: Update Your Components

In your components, use the font like this:

```javascript
<Text style={{ fontFamily: 'BalooBhai2-Regular' }}>Regular text</Text>
<Text style={{ fontFamily: 'BalooBhai2-Bold' }}>Bold text</Text>
```

## Step 5: Alternative - Using Expo Google Fonts

There's also a package for Baloo Bhai 2:

```bash
npx expo install @expo-google-fonts/baloo-bhai-2
```

Then use it like:

```javascript
import { useFonts, BalooBhai2_400Regular, BalooBhai2_500Medium, BalooBhai2_600SemiBold, BalooBhai2_700Bold } from '@expo-google-fonts/baloo-bhai-2';

export default function App() {
  const [fontsLoaded] = useFonts({
    BalooBhai2_400Regular,
    BalooBhai2_500Medium,
    BalooBhai2_600SemiBold,
    BalooBhai2_700Bold,
  });
  
  // Rest of your component...
}
```

And then:

```javascript
<Text style={{ fontFamily: 'BalooBhai2_400Regular' }}>Regular text</Text>
<Text style={{ fontFamily: 'BalooBhai2_700Bold' }}>Bold text</Text>
```

This is the recommended approach since your project is already using Expo Google Fonts.

## Next Steps

Once you've added the fonts, update the fontFamily in your welcome screen component to match the exact name you're using. 