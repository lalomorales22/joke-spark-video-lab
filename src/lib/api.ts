export interface ApiKeys {
  openai: string;
  elevenlabs: string;
}

export interface ElevenLabsVoice {
  id: string;
  name: string;
  gender: string;
  accent: string;
  description: string;
  useCase: string;
}

export const AVAILABLE_VOICES: ElevenLabsVoice[] = [
  {
    id: '9BWtsMINqrJLrRacOk9x',
    name: 'Aria',
    gender: 'female',
    accent: 'American',
    description: 'expressive',
    useCase: 'social media'
  },
  {
    id: 'CwhRBWXzGAHq8TQ4Fs17',
    name: 'Roger',
    gender: 'male', 
    accent: 'American',
    description: 'confident',
    useCase: 'social media'
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    gender: 'female',
    accent: 'American',
    description: 'soft',
    useCase: 'news'
  },
  {
    id: 'FGY2WhTYpPnrIDTdsKH5',
    name: 'Laura',
    gender: 'female',
    accent: 'American',
    description: 'upbeat',
    useCase: 'social media'
  },
  {
    id: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    gender: 'male',
    accent: 'Australian',
    description: 'natural',
    useCase: 'conversational'
  },
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    gender: 'male',
    accent: 'British',
    description: 'warm',
    useCase: 'narration'
  },
  {
    id: 'TX3LPaxmHKxFdv7VOQHJ',
    name: 'Liam',
    gender: 'male',
    accent: 'American',
    description: 'articulate',
    useCase: 'narration'
  },
  {
    id: 'bIHbv24MWmeRgasZH58o',
    name: 'Will',
    gender: 'male',
    accent: 'American',
    description: 'friendly',
    useCase: 'social media'
  },
  {
    id: 'cgSgspJ2msm6clMCkdW9',
    name: 'Jessica',
    gender: 'female',
    accent: 'American',
    description: 'expressive',
    useCase: 'conversational'
  },
  {
    id: 'cjVigY5qzO86Huf0OWal',
    name: 'Eric',
    gender: 'male',
    accent: 'American',
    description: 'friendly',
    useCase: 'conversational'
  }
];

export const getApiKeys = (): ApiKeys | null => {
  try {
    const stored = localStorage.getItem('joke-studio-api-keys');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to retrieve API keys:', error);
    return null;
  }
};

export const hasValidApiKeys = (): boolean => {
  const keys = getApiKeys();
  return !!(keys?.openai && keys?.elevenlabs);
};

export const rewriteJokeWithAI = async (joke: string): Promise<string> => {
  const keys = getApiKeys();
  if (!keys?.openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keys.openai}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a comedy script writer. Rewrite the given joke as a clean script with only dialogue and spoken text. Do NOT include any descriptive words, stage directions, or terms like "cut to", "wife", "narrator says", or any other non-spoken elements. Only provide the actual words that should be spoken aloud. Make it funnier, more engaging, and suitable for short-form video content. Keep it concise but punchy with natural speech patterns.'
          },
          {
            role: 'user',
            content: joke
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || joke;
  } catch (error) {
    console.error('Failed to rewrite joke:', error);
    throw error;
  }
};

export const generateVoiceWithElevenLabs = async (text: string, voiceId: string = '9BWtsMINqrJLrRacOk9x'): Promise<Blob> => {
  const keys = getApiKeys();
  if (!keys?.elevenlabs) {
    throw new Error('ElevenLabs API key not configured');
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': keys.elevenlabs
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Failed to generate voice:', error);
    throw error;
  }
};

export const generateCaptions = (text: string, audioDuration: number) => {
  const words = text.split(' ');
  const wordsPerCaption = 4; // Show 4-5 words at a time, using 4 as base
  const captions = [];
  
  // Group words into chunks of 4-5 words
  for (let i = 0; i < words.length; i += wordsPerCaption) {
    const chunk = words.slice(i, i + wordsPerCaption);
    const chunkText = chunk.join(' ');
    
    // Calculate timing for this chunk
    const startTime = (i / words.length) * audioDuration;
    const endTime = ((i + chunk.length) / words.length) * audioDuration;
    
    captions.push({
      word: chunkText, // Keep this property name for compatibility
      start: startTime,
      end: endTime
    });
  }
  
  return captions;
};

export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getAudioDuration = (audioBlob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    audio.onerror = reject;
    audio.src = URL.createObjectURL(audioBlob);
  });
};