# Gemini AI Integration Setup

## Installation

1. Install the required package:

```bash
npm install @google/genai
```

## API Key Setup

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a `.env.local` file in your project root
3. Add your API key:

```
GEMINI_API_KEY=your_actual_api_key_here
```

## Testing the Integration

1. Start your development server:

```bash
npm run dev
```

2. Navigate to the AI Insights page
3. Try asking questions like:
   - "How are my profit margins?"
   - "What's my cash flow situation?"
   - "Give me business advice"
   - "How can I reduce expenses?"

## API Endpoints

- **POST /api/ai-chat**: Main AI chat endpoint
  - Accepts: `{ message, businessData, context }`
  - Returns: `{ response }`

## Features

✅ **Real-time AI Chat**: Powered by Gemini 2.0 Flash
✅ **Business Data Integration**: Uses actual data from your database
✅ **Conversation Context**: Maintains chat history
✅ **Fallback Responses**: Rule-based backup if API fails
✅ **Error Handling**: Graceful degradation

## Customization

You can modify the AI prompts in `/app/api/ai-chat/route.ts` to:

- Change the AI personality
- Add industry-specific insights
- Include additional business metrics
- Adjust response format and length

## Troubleshooting

**Common Issues:**

1. **"API key not found"**: Make sure `.env.local` exists with `GEMINI_API_KEY`
2. **"Cannot find module @google/genai"**: Run `npm install @google/genai`
3. **API rate limits**: Implement request throttling if needed
4. **Data not loading**: Check database connection and API endpoints

## Model Options

Current model: `gemini-2.0-flash-exp`

Other available models:

- `gemini-1.5-pro` (more capable, slower)
- `gemini-1.5-flash` (faster, good balance)
- `gemini-2.0-flash-exp` (experimental, latest features)

Change the model in the API route:

```typescript
model: "gemini-1.5-pro"; // or your preferred model
```
