// src/services/geminiService.ts

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Clé API Gemini non trouvée. Assurez-vous d'avoir un fichier .env.local avec la ligne : VITE_GEMINI_API_KEY=\"VOTRE_CLÉ_ICI\"");
}

// --- CONFIGURATION MANUELLE POUR L'APPEL DIRECT À VERTEX AI ---
// !!! REMPLACE "VOTRE_ID_PROJET" par l'ID de ton projet Google Cloud !!!
const PROJECT_ID = "mon-check-corres"; 
const LOCATION = "us-central1"; 

// On utilise l'URL qui a répondu (même si c'était une erreur 401), c'est la bonne porte !
// Note: on utilise "generateContent" et non "streamGenerateContent" pour une réponse simple.
const API_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/gemini-1.5-pro-preview-0409:generateContent`;

const TONE_DEFINITIONS: { [key: string]: string } = {
  informatif: `Style d'agence de presse (type AFP, Reuters). Neutre, factuel, objectif. Utilise la structure de la pyramide inversée (l'information la plus importante en premier). Phrases claires et concises. Pas d'opinion.`,
  formel: `Style des grands quotidiens nationaux (type Le Monde, Le Figaro). Vocabulaire soutenu et précis. Phrases complexes mais bien structurées. Ton analytique, distant et expert. Évite les familiarités et les expressions idiomatiques.`,
  narratif: `Style du journalisme "long-form" ou "feature" (type M le Magazine du Monde, The New Yorker). Raconte une histoire. Utilise des techniques de narration : scènes, personnages, dialogues (si présents dans le texte source), tension dramatique.`,
  descriptif: `Style du reportage ou de la critique (type Géo, Télérama). Riche en détails sensoriels. Utilise des adjectifs évocateurs et des métaphores pour peindre une image vivide dans l'esprit du lecteur. L'ambiance et l'atmosphère sont primordiales.`,
  émotionnel: `Style de l'article "human interest" ou de la chronique engagée (type Libération, certain journalisme de témoignage). Cherche à créer une connexion émotionnelle avec le lecteur. Utilise un champ lexical fort, centré sur le pathos. Peut inclure des questions rhétoriques et un point de vue plus personnel.`,
};

export async function generateContent(userText: string, tone: string): Promise<string> {
    const validTone = TONE_DEFINITIONS[tone] ? tone : 'informatif';
    const toneInstruction = TONE_DEFINITIONS[validTone];

    const prompt = `
    Tu es un assistant de rédaction expert, spécialisé dans la transformation de textes bruts en articles journalistiques de haute qualité.
    **Mission :** Analyse le texte brut fourni ci-dessous et réécris-le intégralement en respectant les contraintes suivantes.
    **Contrainte de style impérative :** Tu dois adopter le ton et le style suivants :
    ---
    TON : ${validTone.toUpperCase()}
    DÉFINITION DU STYLE À APPLIQUER : ${toneInstruction}
    ---
    **NOUVELLE RÈGLE - GESTION DES CITATIONS (VERBATIM) :**
    Si le texte brut de l'utilisateur contient des passages entre guillemets français (« ... »), tu dois les traiter comme des citations directes et sacrées.
    1.  **Intégration Obligatoire :** Tu DOIS intégrer ces citations telles quelles dans l'article généré, là où c'est logiquement pertinent.
    2.  **Préservation du Contenu :** Tu n'as PAS le droit de modifier le vocabulaire, la syntaxe, ou la structure de la phrase à l'intérieur des guillemets.
    3.  **Correction Orthographique Autorisée :** Tu es UNIQUEMENT autorisé à corriger discrètement les fautes d'orthographe à l'intérieur des guillemets, mais seulement si cela ne change en rien le sens ou le style original de la citation. Le reste doit être identique.
    **Contrainte de format de sortie :** Ta réponse DOIT être un objet JSON valide et rien d'autre. Ne renvoie AUCUN texte avant ou après l'objet JSON, et n'utilise pas de formatage Markdown comme \`\`\`json.
    L'objet JSON doit avoir la structure suivante :
    { "title": "string", "lede": "string", "hook": "string", "section1": { "intertitle": "string", "paragraph": "string" }, "section2": { "intertitle": "string", "paragraph": "string" } }
    **Texte brut à transformer :**
    ---
    ${userText}
    ---
  `;

  console.log(`Appel DIRECT à l'API Vertex AI avec le ton : ${validTone}`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // --- LA CORRECTION EST ICI : on utilise un header d'authentification ---
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur de l'API Google (Vertex AI) : ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    console.log("Réponse brute reçue de Vertex AI :", generatedText);
    
    const cleanedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();

    if (!cleanedText.startsWith('{')) {
      throw new Error("La réponse de l'IA n'a pas commencé par un '{' comme attendu.");
    }

    return cleanedText;

  } catch (error) {
    console.error("Erreur lors de l'appel direct à l'API Vertex AI:", error);
    throw error;
  }
}