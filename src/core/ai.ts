export interface AIContext {
  errorLog?: string;
  fileContent?: string;
  filePath?: string;
  projectRoot?: string;
  projectFiles?: string[];
}

export interface AIResponse {
  explanation: string;
  rootCause: string;
  fixSuggestion: string;
}

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'mistral';
let ollamaAvailable: boolean | null = null;

async function checkOllamaAvailable(): Promise<boolean> {
  if (ollamaAvailable !== null) return ollamaAvailable;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch('http://localhost:11434/api/tags', { signal: controller.signal });
    clearTimeout(id);
    ollamaAvailable = resp.ok;
    return ollamaAvailable;
  } catch {
    ollamaAvailable = false;
    return false;
  }
}

async function askAI(prompt: string): Promise<string> {
  const available = await checkOllamaAvailable();
  if (!available) {
    throw new Error(
      'Ollama is not running or not accessible at http://localhost:11434.\n' +
      'Please start Ollama first:\n' +
      '  1. Install Ollama from https://ollama.ai\n' +
      '  2. Run: ollama serve\n' +
      '  3. In another terminal: ollama pull mistral\n' +
      '  4. Retry this command.'
    );
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 300000);
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt, stream: false }),
      signal: controller.signal,
    });
    clearTimeout(id);

    if (!response.ok) {
      const error = await response.text();
      if (response.status === 404) {
        throw new Error(
          `Ollama model '${MODEL}' not found.\n` +
          'Please run: ollama pull mistral'
        );
      }
      throw new Error(`Ollama API error: ${response.status} ${error}`);
    }

    const data = (await response.json()) as { response?: string };
    if (!data.response) {
      throw new Error('Ollama returned empty response');
    }
    return data.response.trim();
  } catch (err) {
    if (err instanceof Error && err.message.includes('Ollama')) {
      throw err;
    }
    throw new Error(
      `Failed to reach Ollama at ${OLLAMA_URL}: ${err instanceof Error ? err.message : String(err)}\n` +
      'Ensure Ollama is running: ollama serve'
    );
  }
}

export async function analyzeWithAI(context: AIContext): Promise<AIResponse> {
  const promptParts = [];

  if (context.errorLog) {
    promptParts.push(`Error log:\n${context.errorLog}`);
  }

  if (context.fileContent) {
    promptParts.push(`File: ${context.filePath ?? 'unknown'}\n${context.fileContent}`);
  }

  if (context.projectRoot) {
    promptParts.push(`Project root: ${context.projectRoot}`);
  }

  if (context.projectFiles?.length) {
    promptParts.push(`Project files: ${context.projectFiles.join(', ')}`);
  }

  const prompt = `Analyze the following context and provide an explanation, root cause, and fix suggestion:\n\n${promptParts.join('\n\n')}`;

  const responseText = await askAI(prompt);

  return {
    explanation: `Explanation:\n${responseText}`,
    rootCause: `Root cause:\nReview the above analysis for likely causes.`,
    fixSuggestion: `Fix suggestion:\nUse the analysis to guide your remediation steps.`,
  };
}

export interface SummaryResponse {
  projectDescription: string;
  techStack: string;
  architecture: string;
  improvements: string;
}

export async function summarizeProject(summaryText: string): Promise<SummaryResponse> {
  const prompt = `You are an expert software engineer. Given the following project summary, respond with a JSON object with keys: projectDescription, techStack, architecture, improvements. Keep each value concise (1-3 short paragraphs).\n\nProject summary:\n${summaryText}`;

  const raw = await askAI(prompt);

  // Try to parse JSON from the model. If parse fails, return fallback mapping.
  try {
    const parsed = JSON.parse(raw);
    return {
      projectDescription: String(parsed.projectDescription ?? parsed.description ?? ''),
      techStack: String(parsed.techStack ?? parsed.tech_stack ?? ''),
      architecture: String(parsed.architecture ?? ''),
      improvements: String(parsed.improvements ?? parsed.suggestions ?? ''),
    };
  } catch {
    // Fallback: put the whole response into projectDescription and leave others generic.
    return {
      projectDescription: raw,
      techStack: 'See project description for tech hints.',
      architecture: 'See project description for architecture notes.',
      improvements: 'See project description for suggested improvements.',
    };
  }
}

export interface FixSuggestion {
  correctedCode: string;
  explanation: string;
  filePath?: string;
  startLine?: number;
  endLine?: number;
}

export async function suggestFixForError(params: { errorLog?: string; filePath?: string; fileSnippet?: string; line?: number; projectRoot?: string }): Promise<FixSuggestion> {
  const { errorLog, filePath, fileSnippet, line, projectRoot } = params;

  const promptParts: string[] = [];
  promptParts.push('You are an expert developer and code reviewer.');
  if (errorLog) promptParts.push(`Error log:\n${errorLog}`);
  if (filePath) promptParts.push(`File path: ${filePath}`);
  if (typeof line === 'number') promptParts.push(`Relevant line: ${line}`);
  if (fileSnippet) promptParts.push(`Code snippet:\n${fileSnippet}`);
  if (projectRoot) promptParts.push(`Project root: ${projectRoot}`);

  promptParts.push('\nTask: Propose a corrected code snippet that fixes the error described above. Return a JSON object with keys: correctedCode (the full corrected code block or replacement region), explanation (why this fixes the issue), startLine (optional), endLine (optional). Do NOT include any surrounding commentary outside the JSON.');

  const prompt = promptParts.join('\n\n');

  const raw = await askAI(prompt);

  try {
    const parsed = JSON.parse(raw);
    return {
      correctedCode: String(parsed.correctedCode ?? parsed.code ?? ''),
      explanation: String(parsed.explanation ?? parsed.reason ?? ''),
      filePath: String(parsed.filePath ?? filePath ?? ''),
      startLine: parsed.startLine !== undefined ? Number(parsed.startLine) : undefined,
      endLine: parsed.endLine !== undefined ? Number(parsed.endLine) : undefined,
    };
  } catch {
    // Fallback: attempt to extract code fences from raw, else place raw into explanation
    const codeFenceMatch = raw.match(/```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)\n```/);
    const code = codeFenceMatch ? codeFenceMatch[1] : '';
    return {
      correctedCode: code || '',
      explanation: code ? raw.replace(codeFenceMatch?.[0] ?? '', '').trim() : raw,
      filePath,
    };
  }
}
