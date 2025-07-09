// src/services/geminiService.ts

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Clé API Gemini non trouvée. Assurez-vous d'avoir un fichier .env.local avec la ligne : VITE_GEMINI_API_KEY=\"VOTRE_CLÉ_ICI\"");
}

const genAI = new GoogleGenerativeAI(apiKey);

// On utilise le modèle standard, les instructions seront dans le prompt.
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

/**
 * Génère du contenu en utilisant l'API Gemini et force une réponse JSON.
 * @param userText Le texte brut fourni par l'utilisateur.
 * @returns Une chaîne de caractères contenant l'objet JSON généré par l'IA.
 */
export async function generateContent(userText: string): Promise<string> {
  // === INSTRUCTIONS TRÈS PRÉCISES POUR L'IA ===
  // On lui demande explicitement de retourner UNIQUEMENT un objet JSON.
  const prompt = `
    Analyse le texte brut suivant :
    ---
    ${userText}
    ---
    Transforme-le en un article de style journalistique.
    Ta réponse DOIT être un objet JSON valide et rien d'autre. Pas de texte avant, pas de texte après, pas de formatage Markdown comme \`\`\`json.
    L'objet JSON doit avoir la structure suivante :
    {
      "title": "string",
      "lede": "string",
      "hook": "string",
      "section1": { "intertitle": "string", "paragraph": "string" },
      "section2": { "intertitle": "string", "paragraph": "string" }
    }
  `;

  console.log("Appel de l'API Gemini avec le prompt...");

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedText = response.text();
    
    console.log("Réponse brute reçue de Gemini :", generatedText);
    
    // Petite sécurité : on enlève les ```json au cas où l'IA n'obéit pas parfaitement.
    const cleanedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();

    if (!cleanedText.startsWith('{')) {
      throw new Error("La réponse de l'IA n'a pas commencé par un '{' comme attendu.");
    }

    return cleanedText;

  } catch (error) {
    console.error("Erreur lors de l'appel à l'API Gemini:", error);
    // On propage l'erreur pour que App.tsx puisse l'attraper et l'afficher.
    throw error;
  }
}