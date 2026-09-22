const NANTES_METROPOLE_COMMUNES = [
  'Basse-Goulaine',
  'Bouaye',
  'Bouguenais',
  'Brains',
  'Carquefou',
  'La Chapelle-sur-Erdre',
  'Couëron',
  'Indre',
  'Mauves-sur-Loire',
  'La Montagne',
  'Orvault',
  'Le Pellerin',
  'Rezé',
  'Saint-Aignan-Grandlieu',
  'Saint-Herblain',
  'Saint-Jean-de-Boiseau',
  'Saint-Léger-les-Vignes',
  'Saint-Sébastien-sur-Loire',
  'Sainte-Luce-sur-Loire',
  'Sautron',
  'Les Sorinières',
  'Thouaré-sur-Loire',
  'Vertou',
];

const CARENE_COMMUNES = [
  'Besné',
  'Donges',
  'La Chapelle-des-Marais',
  'Montoir-de-Bretagne',
  'Pornichet',
  'Saint-André-des-Eaux',
  'Saint-Joachim',
  'Saint-Malo-de-Guersac',
  'Trignac',
];

export type LocalizationResult = {
  commune: string;
  label: string;
};

export function getLocalization(
  commune: string
): LocalizationResult {
  const normalized = commune.trim().toLowerCase();

  if (normalized === 'nantes') {
    return {
      commune,
      label: 'à Nantes',
    };
  }

  if (NANTES_METROPOLE_COMMUNES.some(
    (item) => item.toLowerCase() === normalized
  )) {
    return {
      commune,
      label: 'près de Nantes',
    };
  }

  if (normalized === 'saint-nazaire') {
    return {
      commune,
      label: 'à Saint-Nazaire',
    };
  }

  if (CARENE_COMMUNES.some(
    (item) => item.toLowerCase() === normalized
  )) {
    return {
      commune,
      label: 'près de Saint-Nazaire',
    };
  }

  return {
    commune,
    label: 'dans cette commune de Loire-Atlantique',
  };
}