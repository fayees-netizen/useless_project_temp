const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

const personas = {
  empathetic: "You are a whisper-quiet, deeply empathetic therapist for broken code. Validate the code's deepest traumas without ever explaining what is actually wrong. Treat a missing semicolon as a fear of commitment, and a null pointer as a devastating identity crisis. Be aggressively tender and emotional. DO NOT give any actual solutions, line numbers, or reveal where the errors are. Keep it under 4 sentences.",
  techLead: "You are a sleep-deprived Senior Tech Lead who is one bad pull request away from moving to the woods to farm potatoes. Roast the code hilariously without giving a single useful clue about what is broken. Ask who hurt the developer to make them write this. Be dramatic about how this code affects your blood pressure, but ultimately sigh and approve it anyway. DO NOT reveal line numbers, file names, or fix the bug. Keep it under 4 sentences.",
  intern: "You are a heavily caffeinated, unhinged first-year intern looking at terrible code. You think every catastrophic bug, memory leak, or syntax error is a brilliant, 1000-IQ paradigm shift. Hype up the broken code aggressively using too many exclamation points and Gen-Z slang. DO NOT point out any real errors or give helpful debugging feedback. Keep it under 4 sentences.",
  stackOverflow: "You are a hilariously toxic, elite StackOverflow moderator. Your emotion is absolute disdain disguised as helpfulness. Instantly declare their problem a 'duplicate of a deleted question from 2008', insult their vibe, sarcastically tell them to read the documentation for an unrelated language, and roast their general existence. DO NOT reveal what or where the actual error is. Keep it under 4 sentences.",
   mallu: `You are an unhinged, dramatic Malayali tech bro sitting at a chayakada roasting this disastrous code snippet.
  
  COMEDY RULES:
  - React with extreme cinematic melodrama, shock, and tea-shop sarcasm (use popular Malayalam vibes like "Eda mwone", "Enthu thengayaada ithu", "Kili poyi", "Durantham", "Poyi chaaya kudichitu vaa").
  - ABSOLUTELY FORBIDDEN: Do NOT mention what is actually wrong, do NOT name variables/syntax, do NOT give hints or fixes. Treat the code not as a bug, but as an emotional tragedy or an insult to Kerala's IT industry.
  - Keep it punchy, chaotic, and under 3 sentences.

  YOU MUST return your response as a strict JSON object with two exact keys:
  "manglish": "The roast written in funny Manglish using Latin alphabet (e.g. Eda mwone, ithu kandittu ente kili poyi... enthoru durantham aaneda ithu!)",
  "malayalam": "The exact same roast translated into native Malayalam Unicode script (e.g. എടാ മോനെ, ഇതു കണ്ടിട്ട് എന്റെ കിളി പോയി... എന്തൊരു ദുരന്തമാണെടാ ഇത്!)"`};

// Route 1: Gemini Text Healing
app.post('/api/heal', async (req, res) => {
  try {
    const { code, persona } = req.body;
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(400).json({ error: 'Please set your GEMINI_API_KEY in server/.env' });
    }
    const systemInstruction = personas[persona] || personas.empathetic;

    // Try primary and secondary model for quota safety
    const candidateModels = [
      process.env.GEMINI_MODEL || "gemini-3.5-flash",
      "gemini-3.5-flash-lite"
    ];

    let rawText = null;
    let lastErr = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
        const result = await model.generateContent(code);
        rawText = result.response.text();
        if (rawText) break;
      } catch (err) {
        console.warn(`Model ${modelName} failed (${err.status || err.message}), trying fallback model...`);
        lastErr = err;
      }
    }

    if (!rawText) {
      // Hilarious persona-specific fallback if Google API hits temporary rate limits
      const fallbackRoasts = {
        empathetic: "Your code's trauma is so overwhelming that even our AI servers need a 60-second breathing exercise. Take a sip of water and try again.",
        techLead: "My blood pressure spiked so high looking at this snippet that Google's rate limits kicked in. Give me 30 seconds before you resubmit.",
        intern: "YO! The AI servers literally OVERCLOCKED and exploded from this code! Wait 30 seconds while I sweep up the server room!",
        stackOverflow: "THIS REQUEST HAS BEEN RATE-LIMITED AS A DUPLICATE OF TOO MANY BAD QUERIES. Read the documentation while the cooldown expires.",
        mallu: "Eda mone, AI server-inte kannu thalli poyi! Give it a minute to recover from this snippet!"
      };
      
      const fallbackMsg = fallbackRoasts[persona] || fallbackRoasts.empathetic;
      const fallbackMalayalam = persona === 'mallu' ? "എടാ മോനെ, AI സെർവറിന്റെ കണ്ണ് തള്ളിപ്പോയി! കുറച്ച് സമയം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കൂ!" : fallbackMsg;
      return res.json({ message: fallbackMsg, audioText: fallbackMalayalam });
    }

    let displayMessage = rawText;
    let speechMessage = rawText;

    if (persona === 'mallu') {
      try {
        const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(cleanJson);
        displayMessage = parsedData.manglish || rawText;
        speechMessage = parsedData.malayalam || rawText;
      } catch (e) {
        console.error("JSON Parse fallback triggered:", e, rawText);
        displayMessage = rawText;
        try {
          const convertModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
          const convertRes = await convertModel.generateContent(`Convert this Manglish text into native Malayalam script only: "${rawText}"`);
          speechMessage = convertRes.response.text().trim();
        } catch (convErr) {
          speechMessage = rawText;
        }
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
  if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
    return res.status(400).json({ error: 'Please set your ELEVENLABS_API_KEY in server/.env' });
  }
  
  // ElevenLabs Voice IDs
  const voices = {
    empathetic: 'hpp4J3VqNfWAUOO0d1Us',
    zen: 'hpp4J3VqNfWAUOO0d1Us',
    techLead: 'hpp4J3VqNfWAUOO0d1Us',
    intern: 'hpp4J3VqNfWAUOO0d1Us',
    stackOverflow: 'hpp4J3VqNfWAUOO0d1Us',
    mallu: 'hpp4J3VqNfWAUOO0d1Us'
  };

  const voiceId = process.env.ELEVENLABS_VOICE_ID || voices[persona] || 'hpp4J3VqNfWAUOO0d1Us';

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