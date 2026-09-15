export interface EditorialAnalysis {
  subject: string;
  mainInformation: string;
  angle: string;
  people: string[];
  places: string[];
  dates: string[];
  figures: string[];
  quotes: string[];
  vigilance: string[];
}

export interface ArticleSection {
  intertitle: string;
  paragraphs: string[];
}

export interface ArticleOutput {
  title: string;
  lede: string;
  hook: string;
  sections: ArticleSection[];
}

export interface EditorialResult {
  analysis: EditorialAnalysis;
  article: ArticleOutput | null;
}