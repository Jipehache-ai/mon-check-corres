// src/services/openaiService.ts

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("Clé API OpenAI non trouvée. Assurez-vous d'avoir un fichier .env.local avec la ligne : VITE_OPENAI_API_KEY=\"VOTRE_CLÉ_ICI\"");
}

const API_URL = "https://api.openai.com/v1/chat/completions";

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

  // Le prompt système donne le rôle à l'IA
  const systemPrompt = `
    Tu es un assistant de rédaction expert, spécialisé dans la transformation de textes bruts en articles journalistiques de haute qualité.
    Ta réponse DOIT être un objet JSON valide et rien d'autre. Ne renvoie AUCUN texte avant ou après l'objet JSON, et n'utilise pas de formatage Markdown comme \`\`\`json.
    L'objet JSON doit avoir la structure suivante :
    { "title": "string", "lede": "string", "hook": "string", "section1": { "intertitle": "string", "paragraph": "string" }, "section2": { "intertitle": "string", "paragraph": "string" } }
  `;

  // Le prompt utilisateur contient la demande spécifique
  const userPrompt = `
    **Mission :** Analyse le texte brut fourni ci-dessous et réécris-le intégralement en respectant les contraintes suivantes.
    **Contrainte de style impérative :** Tu dois adopter le ton et le style suivants :
    ---
    TON : ${validTone.toUpperCase()}
    DÉFINITION DU STYLE À APPLIQUER : ${toneInstruction}
    ---
    **RÈGLE - GESTION DES CITATIONS (VERBATIM) :**
    Si le texte brut de l'utilisateur contient des passages entre guillemets français (« ... »), tu dois les traiter comme des citations directes et sacrées. Intègre-les telles quelles, en ne corrigeant que l'orthographe si nécessaire.
    ---
    **Texte brut à transformer :**
    ${userText}
  `;

  console.log(`Appel à l'API OpenAI avec le ton : ${validTone}`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // Le modèle le plus récent et performant
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" } // On force la sortie en JSON !
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur de l'API OpenAI : ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    console.log("Réponse brute reçue d'OpenAI :", generatedText);

    // Pas besoin de nettoyer, car on a forcé le format JSON
    return generatedText;

  } catch (error) {
    console.error("Erreur lors de l'appel à l'API OpenAI:", error);
    throw error;
  }
}