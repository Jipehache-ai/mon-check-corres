import React, { useState, useCallback } from 'react';
import { generateContent } from './services/geminiService';
import { ArticleOutput } from './types';
import { InputField } from './components/InputField';
import { CopyButton } from './components/CopyButton';
import { Loader } from './components/Loader';
import { SparklesIcon, ClipboardDocumentListIcon, ExclamationTriangleIcon } from './components/Icons';

// On définit les tons disponibles pour ne pas faire d'erreur
const TONES = ["informatif", "formel", "narratif", "descriptif", "émotionnel"];

export default function App(): React.ReactNode {
  const [rawText, setRawText] = useState<string>('');
  // --- NOUVEAUTÉ 1 : Un état pour stocker le ton choisi ---
  const [selectedTone, setSelectedTone] = useState<string>(TONES[0]); // Par défaut, on choisit le premier
  
  const [articleOutput, setArticleOutput] = useState<ArticleOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!rawText.trim()) {
      setError('Veuillez entrer un texte à transformer.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setArticleOutput(null);

    let resultString = '';
    try {
      // --- NOUVEAUTÉ 2 : On passe le ton choisi à la fonction de génération ---
      resultString = await generateContent(rawText, selectedTone); 
      const parsedResult: ArticleOutput = JSON.parse(resultString);
      setArticleOutput(parsedResult);

    } catch (e) {
      console.error("Erreur lors de la génération ou du parsing :", e);
      if (e instanceof Error) {
        let errorMessage = `Une erreur est survenue: ${e.message}.`;
        if (e.name === 'SyntaxError') {
          errorMessage += ` L'IA a retourné une réponse invalide. Réponse reçue : "${resultString.substring(0, 100)}..."`;
        }
        setError(errorMessage);
      } else {
        setError('Une erreur inconnue est survenue.');
      }
    } finally {
      setIsLoading(false);
    }
  // --- NOUVEAUTÉ 3 : On ajoute selectedTone aux dépendances ---
  }, [rawText, selectedTone]);

  const getFormattedOutput = (): string => {
    if (!articleOutput) return '';
    return `Titre : ${articleOutput.title}\n\nChapeau : ${articleOutput.lede}\n\nAccroche : ${articleOutput.hook}\n\n${articleOutput.section1.intertitle}\n${articleOutput.section1.paragraph}\n\n${articleOutput.section2.intertitle}\n${articleOutput.section2.paragraph}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">Rédacteur Web Pro</h1>
          <p className="mt-2 text-lg text-gray-400">Transformez votre texte brut en article journalistique optimisé avec l'IA.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg ring-1 ring-white/10 flex flex-col">
            <h2 className="text-xl font-semibold text-white mb-4">1. Collez votre texte brut</h2>
            <div className="flex-grow">
              <InputField
                id="raw-text"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="[COLLER ICI VOTRE TEXTE BRUT]"
                isTextarea={true}
                rows={15}
                maxLength={5000}
              />
            </div>
            
            {/* --- NOUVEAUTÉ 4 : Le menu déroulant pour choisir le ton --- */}
            <div className="mt-4">
              <label htmlFor="tone-select" className="block text-sm font-medium text-gray-300 mb-1">
                Choisissez un ton :
              </label>
              <select
                id="tone-select"
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {TONES.map(tone => (
                  <option key={tone} value={tone}>
                    {tone.charAt(0).toUpperCase() + tone.slice(1)} {/* Met la première lettre en majuscule */}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !rawText.trim()}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isLoading ? ( <> <Loader /> <span>Analyse en cours...</span> </> ) : ( <> <SparklesIcon /> <span>Optimiser le texte</span> </> )}
            </button>
          </div>

          {/* ... Le reste du fichier (Output Section) est inchangé ... */}
          <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg ring-1 ring-white/10 relative">
             <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-white">2. Résultat optimisé</h2>
                {articleOutput && ( <CopyButton textToCopy={getFormattedOutput()}> <ClipboardDocumentListIcon /> <span>Copier tout</span> </CopyButton> )}
            </div>
            {isLoading && ( <div className="absolute inset-0 bg-gray-800/50 flex items-center justify-center rounded-lg z-10"> <div className="text-center"> <Loader /> <p className="mt-2 text-gray-300">Génération de l'article...</p> </div> </div> )}
            {error && ( <div className="bg-red-900/50 text-red-200 p-4 rounded-md flex items-start gap-3"> <ExclamationTriangleIcon /> <div> <h3 className="font-semibold">Erreur</h3> <p className="text-sm">{error}</p> </div> </div> )}
            {!isLoading && !error && !articleOutput && ( <div className="flex items-center justify-center h-full text-gray-500 text-center"> <p>Le résultat de l'optimisation apparaîtra ici.</p> </div> )}
            {articleOutput && ( <div className="space-y-4 animate-fade-in"> <InputField id="output-title" label="Titre (SEO)" value={articleOutput.title} isReadOnly={true} maxLength={60} /> <InputField id="output-lede" label="Chapeau" value={articleOutput.lede} isReadOnly={true} isTextarea={true} rows={3} maxLength={250} /> <InputField id="output-hook" label="Accroche" value={articleOutput.hook} isReadOnly={true} /> <InputField id="output-section1-intertitle" label="Intertitre 1" value={articleOutput.section1.intertitle} isReadOnly={true} /> <InputField id="output-section1-paragraph" label="Paragraphe 1" value={articleOutput.section1.paragraph} isReadOnly={true} isTextarea={true} rows={5} /> <InputField id="output-section2-intertitle" label="Intertitre 2" value={articleOutput.section2.intertitle} isReadOnly={true} /> <InputField id="output-section2-paragraph" label="Paragraphe 2" value={articleOutput.section2.paragraph} isReadOnly={true} isTextarea={true} rows={5} /> </div> )}
          </div>
        </main>
      </div>
    </div>
  );
}