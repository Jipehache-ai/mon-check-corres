export interface GenerateOptions {
  mode: 'analyze' | 'write';
  userText: string;
  contentType: string;
  articleType: string;
  objective: string;
  style: string;
  angle?: string;
}

export async function generateContent(
  options: GenerateOptions
): Promise<string> {

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(options)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error || 'Impossible de contacter le serveur.'
    );
  }

  if (!data?.content) {
    throw new Error(
      'Le serveur n’a retourné aucun contenu.'
    );
  }

  return data.content;
}