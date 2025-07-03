export interface ApiKeys {
  openai: string;
  elevenlabs: string;
}

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
            content: 'You are a comedy expert. Rewrite the given joke to make it funnier, more engaging, and suitable for short-form video content. Keep it concise but punchy. Make sure the timing and delivery work well for spoken format.'
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

export const generateVoiceWithElevenLabs = async (text: string): Promise<Blob> => {
  const keys = getApiKeys();
  if (!keys?.elevenlabs) {
    throw new Error('ElevenLabs API key not configured');
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x', {
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
  const timePerWord = audioDuration / words.length;
  
  const captions = words.map((word, index) => ({
    word,
    start: index * timePerWord,
    end: (index + 1) * timePerWord
  }));
  
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