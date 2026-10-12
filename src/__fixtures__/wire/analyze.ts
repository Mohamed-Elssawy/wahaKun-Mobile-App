// POST /Issue/analyze - AiAnalysisResponse, BACKEND-INTEGRATION-FACTS.md §4.1.
// The response is the whole of filing a report now: creation is a Hangfire job, carries no id,
// and does not happen at all when the mapped priority is Low or Unknown - F23.

/** The six §4.1 maps to Medium or above, and so the only six that create an issue. */
export const CREATES_AN_ISSUE = [
  'حرجة جداً',
  'حرجة',
  'عالية جداً',
  'عالية',
  'متوسطة',
  'منخفضة',
] as const;

/** The four that map to Low or Unknown. A diagnosis is returned and nothing is ever saved. */
export const CREATES_NOTHING = ['بسيطة', 'بسيطة جداً', 'غير مؤثرة', 'غير معروفة'] as const;

/** The vision service formats confidence as "95.98%", so ParseConfidence stores 95.98. */
export function analyzeResponse(overrides: Record<string, unknown> = {}): unknown {
  return {
    filePath: 'http://127.0.0.1:9000/reportimage/reportimage/f8086949.jpg',
    problemName: 'Pipe_Damage',
    problemArabic: 'تسريب في الأنبوب',
    confidence: 95.98,
    severity: 'حرجة جداً',
    recommendation: 'أوقف مصدر المياه',
    explanation: 'الأنبوب متصدع عند الوصلة',
    repairSteps: ['أوقف المضخة', 'استبدل الوصلة'],
    ...overrides,
  };
}

export const mediumPlus: unknown = analyzeResponse();

export const lowSeverity: unknown = analyzeResponse({ severity: 'بسيطة', confidence: 41.2 });

/** The success body as it really arrives: the vision service sends no problem_code. */
export const nullsFromVisionService: unknown = analyzeResponse({
  problemName: null,
  recommendation: null,
  repairSteps: null,
  explanation: null,
});
