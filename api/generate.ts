import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Méthode non autorisée'
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY non configurée sur le serveur.'
    });
  }

  try {
    const {
      mode,
      userText,
      contentType,
      articleType,
      objective,
      style,
      angle
    } = req.body;

    if (!userText || typeof userText !== 'string') {
      return res.status(400).json({
        error: 'Le texte source est obligatoire.'
      });
    }

    const safeMode =
      mode === 'write' ? 'write' : 'analyze';

    const safeContentType =
      typeof contentType === 'string' && contentType.trim()
        ? contentType
        : 'Dépêche / article';

    const safeArticleType =
      typeof articleType === 'string' && articleType.trim()
        ? articleType
        : 'Actualité';

    const safeObjective =
      typeof objective === 'string' && objective.trim()
        ? objective
        : 'Google Discover';

    const safeStyle =
      typeof style === 'string' && style.trim()
        ? style
        : 'Journalistique';

    const safeAngle =
      typeof angle === 'string'
        ? angle
        : '';

    let prompt = '';

    if (safeMode === 'analyze') {

      prompt = `
Tu es un assistant éditorial expert pour un média web français.

Tu dois ANALYSER une matière journalistique.

RÈGLES ABSOLUES :

- Ne jamais inventer une information absente de la source.
- Ne jamais inventer de personne, lieu, date, chiffre ou événement.
- Respecter strictement les faits présents dans la source.
- Respecter les chiffres présents dans la source.
- Les citations entre guillemets français (« ... ») doivent être conservées fidèlement.
- Ne jamais transformer une hypothèse en certitude.
- Ne jamais ajouter de contexte extérieur.
- Ne jamais utiliser de clickbait.
- Si une information manque, indique-le.
- Si une information semble devoir être vérifiée, signale-la dans "vigilance".

PARAMÈTRES ÉDITORIAUX :

Type de matière : ${safeContentType}
Type d'article : ${safeArticleType}
Objectif : ${safeObjective}
Style souhaité : ${safeStyle}

ANALYSE DEMANDÉE :

Identifie :

1. Le sujet général.
2. L'information principale.
3. L'angle éditorial le plus évident.
4. Les personnes citées ou mentionnées.
5. Les lieux.
6. Les dates.
7. Les chiffres et données importantes.
8. Les citations directes.
9. Les éventuels points de vigilance.

Si une catégorie n'est pas présente dans la source,
retourne un tableau vide.

Ne complète jamais une information manquante
avec tes connaissances générales.

FORMAT DE SORTIE :

Retourne UNIQUEMENT un objet JSON valide :

{
  "subject": "string",
  "mainInformation": "string",
  "angle": "string",
  "people": ["string"],
  "places": ["string"],
  "dates": ["string"],
  "figures": ["string"],
  "quotes": ["string"],
  "vigilance": ["string"]
}

TEXTE SOURCE :
--------------------
${userText}
--------------------
`;

    } else {

      prompt = `
Tu es un assistant éditorial expert pour un média web français.

Ta mission est de RÉDIGER un article à partir
EXCLUSIVEMENT de la matière journalistique fournie.

RÈGLES ABSOLUES :

- Ne jamais inventer une information absente de la source.
- Ne jamais inventer de personne, lieu, date, chiffre ou événement.
- Respecter strictement les faits présents dans la source.
- Respecter les chiffres présents dans la source.
- Les citations entre guillemets français (« ... ») doivent être conservées fidèlement.
- Ne jamais transformer une hypothèse en certitude.
- Ne jamais ajouter de contexte extérieur.
- Ne jamais utiliser de clickbait.
- Éviter les répétitions.
- Ne pas répéter l'information principale dans chaque paragraphe.
- Chaque paragraphe doit apporter une information différente.
- Privilégier des phrases courtes adaptées à la lecture mobile.
- Les intertitres doivent être informatifs.
- Le titre doit être fidèle à la matière.
- Le chapeau doit présenter clairement l'information principale.
- L'accroche doit donner envie de poursuivre la lecture sans clickbait.

PARAMÈTRES ÉDITORIAUX :

Type de matière : ${safeContentType}
Type d'article : ${safeArticleType}
Objectif : ${safeObjective}
Style : ${safeStyle}

ANGLE RETENU PAR LE JOURNALISTE :

${safeAngle}

IMPORTANT :

Cet angle doit guider la construction de l'article,
mais tu ne dois jamais ajouter de faits absents de la source.

STRUCTURE :

- un titre ;
- un chapeau ;
- une accroche ;
- plusieurs sections cohérentes ;
- chaque section possède un intertitre ;
- chaque section peut contenir plusieurs paragraphes ;
- éviter les répétitions entre chapeau, accroche et corps de l'article.

FORMAT DE SORTIE :

Retourne UNIQUEMENT un objet JSON valide :

{
  "title": "string",
  "lede": "string",
  "hook": "string",
  "sections": [
    {
      "intertitle": "string",
      "paragraphs": ["string"]
    }
  ]
}

TEXTE SOURCE :
--------------------
${userText}
--------------------
`;

    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5.6-luna',
        input: prompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erreur OpenAI:', data);

      return res.status(response.status).json({
        error: 'Erreur OpenAI',
        details: data
      });
    }

    const generatedText =
      data.output
        ?.find(
          (item: any) => item.type === 'message'
        )
        ?.content
        ?.find(
          (item: any) => item.type === 'output_text'
        )
        ?.text || '';

    if (!generatedText) {
      return res.status(500).json({
        error: 'OpenAI n’a retourné aucun contenu.'
      });
    }

    return res.status(200).json({
      content: generatedText
    });

  } catch (error) {
    console.error('Erreur serveur:', error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Une erreur interne est survenue.'
    });
  }
}