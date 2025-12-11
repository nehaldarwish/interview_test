// server/src/debug-models.ts
import axios from 'axios';  // Install if needed: npm install axios

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function listModels() {
  if (!GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY is required');
    return;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_API_KEY}`;
    const response = await axios.get(url);
    
    console.log('Available Gemini models:');
    response.data.models.forEach((model: any) => {
      console.log(`- ${model.name} (Supported: ${model.supportedGenerationMethods?.join(', ') || 'None'})`);
    });
  } catch (error: any) {
    console.error('Error fetching models:', error.response?.data || error.message);
  }
}

listModels();