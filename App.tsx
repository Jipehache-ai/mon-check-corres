import React, { useCallback, useState } from 'react';
import { generateContent } from './services/openaiService';
import { getLocalization } from './services/localization';
import { EditorialResult } from './types';
import { InputField } from './components/InputField';
import { CopyButton } from './components/CopyButton';
import { Loader } from './components/Loader';
import {
  SparklesIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
} from './components/Icons';

const CONTENT_TYPES = [
  'Dépêche / article',
  'Communiqué',
  'Notes personnelles',
  'Interview',
  'Informations diverses',
  'Autre',
];

const ARTICLE_TYPES = [
  'Actualité',
  'Pratique',
  'Insolite',
  'Tourisme',
  'Portrait',
  'Interview',
  'Décryptage',
  'Quiz',
  'Agenda / événement',
];

const OBJECTIVES = [
  'Google Discover',
  'SEO',
  'Lecture mobile',
  'Article classique',
  'Réseaux sociaux',
];

const STYLES = [
  'Journalistique',
  'Pratique',
  'Reportage',
  'Explicatif',
];

function checkLedeLocation(
  lede: string,
  commune: string
): boolean {
  if (!lede.trim() || !commune.trim()) {
    return false;
  }

  const expected = `${commune} (Loire-Atlantique)`;

  return lede
    .toLocaleLowerCase('fr-FR')
    .includes(expected.toLocaleLowerCase('fr-FR'));
}

export default function App(): React.ReactNode {
  const [rawText, setRawText] = useState('');
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [articleType, setArticleType] = useState(ARTICLE_TYPES[0]);
  const [objective, setObjective] = useState(OBJECTIVES[0]);
  const [style, setStyle] = useState(STYLES[0]);

  const [result, setResult] = useState<EditorialResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Étape 1 :
   * Analyse de la matière journalistique.
   */
  const handleGenerate = useCallback(async () => {
    if (!rawText.trim()) {
      setError('Veuillez entrer un texte source.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const resultString = await generateContent({
        mode: 'analyze',
        userText: rawText,
        contentType,
        articleType,
        objective,
        style,
      });

      const parsedAnalysis = JSON.parse(resultString);

      setResult({
        analysis: parsedAnalysis,
        article: null,
      });
    } catch (e) {
      console.error(
        'Erreur lors de l’analyse ou du parsing :',
        e
      );

      if (e instanceof Error) {
        setError(`Une erreur est survenue : ${e.message}`);
      } else {
        setError('Une erreur inconnue est survenue.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    rawText,
    contentType,
    articleType,
    objective,
    style,
  ]);

  /**
   * Étape 2 :
   * Rédaction de l'article à partir de l'analyse
   * et de l'angle choisi par le journaliste.
   */
  const handleWriteArticle = useCallback(async () => {
    if (!result) {
      setError('L’analyse éditoriale est introuvable.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const localization = getLocalization(
  result.analysis.commune
);

const resultString = await generateContent({
  mode: 'write',
  userText: rawText,
  contentType,
  articleType,
  objective,
  style,
  angle: result.analysis.angle,
  localization: localization.label,
});

      const article = JSON.parse(resultString);

// Contrôle du titre
const title = typeof article.title === 'string'
  ? article.title.trim()
  : '';

const titleLength = title.length;

const localizationIsCorrect =
  !localization.label || title.endsWith(localization.label);

const titleIsValid =
  titleLength < 120 &&
  localizationIsCorrect;

if (!titleIsValid) {
  setError(
    `Titre à corriger : ${titleLength} caractères. ` +
    `La localisation doit apparaître exactement à la fin du titre.`
  );
}

setResult({
  ...result,
  article,
});

    } catch (e) {
      console.error(
        'Erreur lors de la rédaction :',
        e
      );

      if (e instanceof Error) {
        setError(`Une erreur est survenue : ${e.message}`);
      } else {
        setError('Une erreur inconnue est survenue.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    result,
    rawText,
    contentType,
    articleType,
    objective,
    style,
  ]);

  /**
   * Prépare le texte complet pour le bouton "Copier tout".
   */
  const getFormattedOutput = (): string => {
    if (!result || !result.article) {
      return '';
    }

    const analysis = result.analysis;
    const article = result.article;

    const sections = article.sections
      .map(
        (section) =>
          `${section.intertitle}\n${section.paragraphs.join('\n\n')}`
      )
      .join('\n\n');

    return `TITRE : ${article.title}

CHAPEAU : ${article.lede}

ACCROCHE : ${article.hook}

${sections}

ANALYSE ÉDITORIALE

SUJET : ${analysis.subject}

INFORMATION PRINCIPALE : ${analysis.mainInformation}

ANGLE : ${analysis.angle}

PERSONNES : ${analysis.people.join(', ')}

LIEUX : ${analysis.places.join(', ')}

DATES : ${analysis.dates.join(', ')}

CHIFFRES : ${analysis.figures.join(', ')}

CITATIONS :
${analysis.quotes.join('\n')}

POINTS DE VIGILANCE :
${analysis.vigilance.join('\n')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* EN-TÊTE */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Rédacteur Web Pro
          </h1>

          <p className="mt-2 text-lg text-gray-400">
            Assistant éditorial pour journalistes et rédacteurs web
          </p>
        </header>

        <main className="space-y-8">

          {/* ====================================================== */}
          {/* ① SOURCE + PARAMÈTRES                                  */}
          {/* ====================================================== */}

          <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg ring-1 ring-white/10">

            <h2 className="text-xl font-semibold text-white mb-5">
              ① Source et consignes éditoriales
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* SOURCE */}
              <div>
                <InputField
                  id="raw-text"
                  label="Texte source"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Collez ici votre dépêche, communiqué, interview, notes ou matière journalistique..."
                  isTextarea
                  rows={14}
                  maxLength={10000}
                />

                <div className="mt-2 text-sm text-gray-500">
                  {rawText.length} / 10000 caractères
                </div>
              </div>

              {/* PARAMÈTRES */}
              <div className="space-y-5">

                {/* TYPE DE MATIÈRE */}
                <div>
                  <label
                    htmlFor="content-type"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Type de matière
                  </label>

                  <select
                    id="content-type"
                    value={contentType}
                    onChange={(e) =>
                      setContentType(e.target.value)
                    }
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                  >
                    {CONTENT_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TYPE D'ARTICLE */}
                <div>
                  <label
                    htmlFor="article-type"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Type d'article
                  </label>

                  <select
                    id="article-type"
                    value={articleType}
                    onChange={(e) =>
                      setArticleType(e.target.value)
                    }
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                  >
                    {ARTICLE_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* OBJECTIF */}
                <div>
                  <label
                    htmlFor="objective"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Objectif
                  </label>

                  <select
                    id="objective"
                    value={objective}
                    onChange={(e) =>
                      setObjective(e.target.value)
                    }
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                  >
                    {OBJECTIVES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* STYLE */}
                <div>
                  <label
                    htmlFor="style"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Style rédactionnel
                  </label>

                  <select
                    id="style"
                    value={style}
                    onChange={(e) =>
                      setStyle(e.target.value)
                    }
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                  >
                    {STYLES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* BOUTON ANALYSE */}
            <button
              onClick={handleGenerate}
              disabled={isLoading || !rawText.trim()}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader />
                  <span>Analyse en cours...</span>
                </>
              ) : (
                <>
                  <SparklesIcon />
                  <span>Analyser la matière</span>
                </>
              )}
            </button>

          </section>

          {/* ====================================================== */}
          {/* ERREUR                                                  */}
          {/* ====================================================== */}

          {error && (
            <div className="bg-red-900/50 text-red-200 p-4 rounded-md flex items-start gap-3">
              <ExclamationTriangleIcon />

              <div>
                <h3 className="font-semibold">
                  Erreur
                </h3>

                <p className="text-sm">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* ====================================================== */}
          {/* ② ANALYSE ÉDITORIALE                                   */}
          {/* ====================================================== */}

          {result && !isLoading && (
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">

              {/* ANALYSE */}
              <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg ring-1 ring-white/10">

                <h2 className="text-xl font-semibold text-white mb-5">
                  ② Analyse éditoriale
                </h2>

                <div className="space-y-5">

                  {/* SUJET */}
                  <InputField
                    id="analysis-subject"
                    label="Sujet"
                    value={result.analysis.subject}
                    isReadOnly
                  />

                  {/* INFORMATION PRINCIPALE */}
                  <InputField
                    id="analysis-main-information"
                    label="Information principale"
                    value={result.analysis.mainInformation}
                    isReadOnly
                    isTextarea
                    rows={3}
                  />

                  {/* ANGLE MODIFIABLE */}
                  <InputField
                    id="analysis-angle"
                    label="Angle éditorial proposé"
                    value={result.analysis.angle}
                    onChange={(e) =>
                      setResult({
                        ...result,
                        analysis: {
                          ...result.analysis,
                          angle: e.target.value,
                        },
                      })
                    }
                    isTextarea
                    rows={3}
                  />

                  {/* PERSONNES */}
                  <InputField
                    id="analysis-people"
                    label="Personnes"
                    value={result.analysis.people.join(' • ')}
                    isReadOnly
                  />

                  {/* LIEUX */}
                  <InputField
                    id="analysis-places"
                    label="Lieux"
                    value={result.analysis.places.join(' • ')}
                    isReadOnly
                  />

                  {/* DATES */}
                  <InputField
                    id="analysis-dates"
                    label="Dates"
                    value={result.analysis.dates.join(' • ')}
                    isReadOnly
                  />

                  {/* CHIFFRES */}
                  <InputField
                    id="analysis-figures"
                    label="Chiffres"
                    value={result.analysis.figures.join(' • ')}
                    isReadOnly
                  />

                  {/* CITATIONS */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Citations
                    </label>

                    <div className="space-y-2">
                      {result.analysis.quotes.length > 0 ? (
                        result.analysis.quotes.map(
                          (quote, index) => (
                            <div
                              key={`${quote}-${index}`}
                              className="bg-gray-900/50 border border-gray-700 rounded-md p-3 text-sm text-gray-300"
                            >
                              {quote}
                            </div>
                          )
                        )
                      ) : (
                        <div className="text-sm text-gray-500">
                          Aucune citation détectée.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* POINTS DE VIGILANCE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Points de vigilance
                    </label>

                    <div className="space-y-2">
                      {result.analysis.vigilance.length > 0 ? (
                        result.analysis.vigilance.map(
                          (item, index) => (
                            <div
                              key={`${item}-${index}`}
                              className="bg-yellow-900/20 border border-yellow-700/50 rounded-md p-3 text-sm text-yellow-200"
                            >
                              {item}
                            </div>
                          )
                        )
                      ) : (
                        <div className="text-sm text-gray-500">
                          Aucun point de vigilance détecté.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BOUTON RÉDACTION */}
                  <div className="border-t border-gray-700 pt-5 mt-6">

                    <button
                      onClick={handleWriteArticle}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader />
                          <span>
                            Rédaction en cours...
                          </span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon />
                          <span>
                            Rédiger l'article
                          </span>
                        </>
                      )}
                    </button>

                  </div>

                </div>
              </div>

              {/* ================================================== */}
              {/* ③ ARTICLE                                          */}
              {/* ================================================== */}

              {result.article && (
                <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg ring-1 ring-white/10">

                  <div className="flex justify-between items-start mb-5">

                    <h2 className="text-xl font-semibold text-white">
                      ③ Article
                    </h2>

                    <CopyButton
                      textToCopy={getFormattedOutput()}
                    >
                      <ClipboardDocumentListIcon />
                      <span>Copier tout</span>
                    </CopyButton>

                  </div>

                  <div className="space-y-5">

                    {/* TITRE */}
                    <InputField
                      id="output-title"
                      label="Titre"
                      value={result.article.title}
                      isReadOnly
                      maxLength={120}
                    />
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
  Titre : {result.article.title.length} / 119 caractères
</div>

                    {/* CHAPEAU */}
                    <InputField
                      id="output-lede"
                      label="Chapeau"
                      value={result.article.lede}
                      isReadOnly
                      isTextarea
                      rows={4}
                      maxLength={350}
                    />

                    {/* ACCROCHE */}
                    <InputField
                      id="output-hook"
                      label="Accroche"
                      value={result.article.hook}
                      isReadOnly
                      isTextarea
                      rows={3}
                    />

                    {/* SECTIONS */}
                    {result.article.sections.map(
                      (section, sectionIndex) => (
                        <div
                          key={`${section.intertitle}-${sectionIndex}`}
                          className="border-t border-gray-700 pt-5"
                        >

                          <InputField
                            id={`section-${sectionIndex}-intertitle`}
                            label={`Intertitre ${sectionIndex + 1}`}
                            value={section.intertitle}
                            isReadOnly
                          />

                          <div className="mt-3 space-y-3">

                            {section.paragraphs.map(
                              (
                                paragraph,
                                paragraphIndex
                              ) => (
                                <InputField
                                  key={`${sectionIndex}-${paragraphIndex}`}
                                  id={`section-${sectionIndex}-paragraph-${paragraphIndex}`}
                                  label={
                                    paragraphIndex === 0
                                      ? 'Paragraphe'
                                      : undefined
                                  }
                                  value={paragraph}
                                  isReadOnly
                                  isTextarea
                                  rows={5}
                                />
                              )
                            )}

                          </div>

                        </div>
                      )
                    )}

                  </div>
                </div>
              )}

            </section>
          )}

        </main>
      </div>
    </div>
  );
}