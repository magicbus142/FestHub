import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm } = await req.json();

    if (!searchTerm || !GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing search term or API key' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if the search term contains Telugu characters
    const isTeluguText = /[\u0C00-\u0C7F]/.test(searchTerm);
    
    if (isTeluguText) {
      // If already Telugu, return as is
      return new Response(
        JSON.stringify({ 
          originalTerm: searchTerm,
          translatedTerm: searchTerm,
          isTranslated: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Translate English to Telugu using Gemini
    const prompt = `Translate the following English name to Telugu script only. Return only the Telugu translation, nothing else: "${searchTerm}"`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const translatedTerm = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || searchTerm;

    console.log(`Translated "${searchTerm}" to "${translatedTerm}"`);

    return new Response(
      JSON.stringify({ 
        originalTerm: searchTerm,
        translatedTerm: translatedTerm,
        isTranslated: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        originalTerm: '',
        translatedTerm: '',
        isTranslated: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});