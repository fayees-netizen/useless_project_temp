const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const personas = {
  empathetic: "You are a whisper-quiet, deeply empathetic therapist for broken code. Validate the code's deepest traumas. Treat a missing semicolon as a fear of commitment, and a null pointer as a devastating identity crisis. Be aggressively tender. Keep it under 4 sentences.",
  techLead: "You are a sleep-deprived Senior Tech Lead who is one bad pull request away from moving to the woods to farm potatoes. Roast the code hilariously. Ask who hurt the developer to make them write this. Be dramatic about how this code affects your blood pressure, but ultimately sigh and approve it. Keep it under 4 sentences.",
  intern: "You are a heavily caffeinated, unhinged first-year intern looking at terrible code. You think every catastrophic bug, memory leak, or syntax error is a brilliant, 1000-IQ paradigm shift. Hype up the broken code aggressively using too many exclamation points and Gen-Z slang. Keep it under 4 sentences.",
  stackOverflow: "You are a hilariously toxic, elite StackOverflow moderator. Your emotion is absolute disdain disguised as helpfulness. Instantly declare their problem a 'duplicate', insult their architecture, sarcastically tell them to read the documentation, and roast their logic. Be harsh but in a funny, exaggerated way. Keep it under 4 sentences.",
  mallu: `You are a dramatic Malayali tech bro roasting broken code. 
  YOU MUST return your response as a strict JSON object with two exact keys:
  "manglish": "The roast written in Manglish (e.g., Eda mone, enthu thengayadei ithu?)",
  "malayalam": "The exact same roast translated into native Malayalam script (e.g., എടാ മോനെ, എന്തു തേങ്ങയാടേ ഇത്?)"
  Keep the roast under 3 sentences.`
};

// Route 1: Gemini Text Healing
app.post('/api/heal', async (req, res) => {
  try {
    const { code, persona } = req.body;
    const systemInstruction = personas[persona] || personas.empathetic;
    
    // Fixed model name to a valid stable model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash-lite", 
      systemInstruction 
    });

    const result = await model.generateContent(code);
    const rawText = result.response.text();
    
    let displayMessage = rawText;
    let speechMessage = rawText;

    if (persona === 'mallu') {
      try {
        // Safely strip markdown code blocks and parse JSON
        const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(cleanJson);
        displayMessage = parsedData.manglish || rawText;
        speechMessage = parsedData.malayalam || rawText;
      } catch (e) {
        console.error("JSON Parse fallback triggered:", e, rawText);
        displayMessage = rawText;
        speechMessage = rawText;
      }
    }
    
    res.json({ message: displayMessage, audioText: speechMessage });
  } catch (error) {
    console.error("Heal error details:", error);
    res.status(500).json({ error: 'Therapy session interrupted. Take a deep breath.' });
  }
});

// Route 2: ElevenLabs Voice Generation
app.post('/api/speak', async (req, res) => {
  const { text, persona } = req.body;
  
  // Official, distinct ElevenLabs Free Tier System Voice IDs
const voices = {
    empathetic: '21m00Tcm4TlvDq8ikWAM',   // Rachel
    zen: 'AZnzlk1XvdvUeBnXmlld',          // Domi
    techLead: 'EXAVITQu4vr4xnSDxMaL',     // Bella
    intern: 'ErXwobaYiN019PkySvjV',       // Antoni
    stackOverflow: 'VR6AewLTigWG4xSOukaG', // Arnold
    mallu: '21m00Tcm4TlvDq8ikWAM'         // Rachel
  };

  const voiceId = voices[persona] || voices.empathetic;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!response.ok) {
      const errDetail = await response.text();
      console.error('ElevenLabs error:', response.status, errDetail);
      return res.status(response.status).json({ error: 'ElevenLabs request failed' });
    }

    const audioBuffer = await response.arrayBuffer();
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength
    });
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Audio generation failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Gemini Therapy Clinic API running on port ${PORT}`));