// src/services/geminiService.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Clé API Gemini non trouvée. Assurez-vous d'avoir un fichier .env.local avec la ligne : VITE_GEMINI_API_KEY=\"VOTRE_CLÉ_ICI\"");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
});

const TONE_DEFINITIONS: { [key: string]: string } = {
  informatif: `Style d'agence de presse (type AFP, Reuters). Neutre, factuel, objectif. Utilise la structure de la pyramide inversée (l'information la plus importante en premier). Phrases claires et concises. Pas d'opinion.`,
  formel: `Style des grands quotidiens nationaux (type Le Monde, Le Figaro). Vocabulaire soutenu et précis. Phrases complexes mais bien structurées. Ton analytique, distant et expert. Évite les familiarités et les expressions idiomatiques.`,
  narratif: `Style du journalisme "long-form" ou "feature" (type M le Magazine du Monde, The New Yorker). Raconte une histoire. Utilise des techniques de narration : scènes, personnages, dialogues (si présents dans le texte source), tension dramatique.`,
  descriptif: `Style du reportage ou de la critique (type Géo, Télérama). Riche en détails sensoriels. Utilise des adjectifs évocateurs et des métaphores pour peindre une image vivide dans l'esprit du lecteur. L'ambiance et l'atmosphère sont primordiales.`,
  émotionnel: `Style de l'article "human interest" ou de la chronique engagée (type Libération, certain journalisme de témoignage). Cherche à créer une connexion émotionnelle avec le lecteur. Utilise un champ lexical fort, centré sur le pathos. Peut inclure des questions rhétoriques et un point de vue plus personnel.`,
};

export async function generateContent(userText: string, tone: string): Promise<string> {
  // On vérifie que le ton est valide, sinon on prend une valeur par défaut.
  const validTone = TONE_DEFINITIONS[tone] ? tone : 'informatif';
  const toneInstruction = TONE_DEFINITIONS[validTone];

  // === CORRECTION ICI ===
  // On construit le prompt de manière plus sûre.
  const prompt = `
    Tu es un assistant de rédaction expert, spécialisé dans la transformation de textes bruts en articles journalistiques de haute qualité.

    **Mission :** Analyse le texte brut fourni ci-dessous et réécris-le intégralement.
    
    **Contrainte de style impérative :** Tu dois adopter le ton et le style suivants :
    ---
    TON : ${validTone.toUpperCase()}
    DÉFINITION DU STYLE À APPLIQUER : ${toneInstruction}
    ---

    **Contrainte de format de sortie :** Ta réponse DOIT être un objet JSON valide et rien d'autre. Ne renvoie AUCUN texte avant ou après l'objet JSON, et n'utilise pas de formatage Markdown comme \`\`\`json.
    L'objet JSON doit avoir la structure suivante :
    {
      "title": "string",
      "lede": "string",
      "hook": "string",
      "section1": { "intertitle": "string", "paragraph": "string" },
      "section2": { "intertitle": "string", "paragraph": "string" }
    }

    **Texte brut à transformer :**
    ---
    ${userText}
    ---
  `;

  console.log(`Appel de l'API Gemini avec le modèle PRO et le ton : ${validTone}`);

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedText = response.text();
    
    console.log("Réponse brute reçue de Gemini :", generatedText);
    
    const cleanedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();

    if (!cleanedText.startsWith('{')) {
      throw new Error("La réponse de l'IA n'a pas commencé par un '{' comme attendu.");
    }

    return cleanedText;

  } catch (error) {
    console.error("Erreur lors de l'appel à l'API Gemini:", error);
    throw error;
  }
}