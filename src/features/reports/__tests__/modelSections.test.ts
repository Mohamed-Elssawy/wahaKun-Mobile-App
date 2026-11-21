import { stripModelSections } from '../services/reportService';

// Both strings are verbatim from the deployment: ReportService writes the whole model output in.
const WIRE_RECOMMENDATION =
  'افحص القناة وشوف مكان الانسداد، ونظفه بنفسك.\n' +
  'Explanation: تم رصد عائق داخل قناة الري يمنع تدفق المياه.\n' +
  'Steps: افحص القناة وشوف مكان الانسداد., لو طين أو رمال، نضفه بإيدك أو باستخدام مجرفة.\n' +
  'Severity Factors: {"critical": "انسداد كامل يوقف الري", "low": "رواسب بسيطة"}';

/** `explanation`, and the issue `description` built from it, open at `Steps:` not `Explanation:`. */
const WIRE_EXPLANATION =
  'تم رصد عائق داخل قناة الري يمنع تدفق المياه.\n' +
  'Steps: افحص القناة وشوف مكان الانسداد., لو طين أو رمال، نضفه بإيدك أو باستخدام مجرفة.\n' +
  'Severity Factors: {"critical": "انسداد كامل يوقف الري", "low": "رواسب بسيطة"}';

describe('stripModelSections', () => {
  it('keeps only the advice addressed to the farmer', () => {
    expect(stripModelSections(WIRE_RECOMMENDATION)).toBe(
      'افحص القناة وشوف مكان الانسداد، ونظفه بنفسك.',
    );
  });

  // The field F-03a's لماذا هذا التشخيص card draws, and the one بلاغاتي titles fall back to.
  it('keeps only the explanation when the dump opens at Steps', () => {
    expect(stripModelSections(WIRE_EXPLANATION)).toBe(
      'تم رصد عائق داخل قناة الري يمنع تدفق المياه.',
    );
  });

  it.each(['Explanation', 'Steps', 'Severity Factors'])(
    'cuts at %s even when the earlier sections are absent',
    section => {
      expect(stripModelSections(`نصيحة قصيرة.\n${section}: whatever follows`)).toBe(
        'نصيحة قصيرة.',
      );
    },
  );

  it('leaves text that carries no section labels untouched', () => {
    expect(stripModelSections('أوقف المياه فوراً وأصلح الأنبوب.')).toBe(
      'أوقف المياه فوراً وأصلح الأنبوب.',
    );
  });

  // A label mid-sentence is prose, not a section header, so it must not truncate the text.
  it('only cuts at a line start', () => {
    expect(stripModelSections('راجع الـ Steps: الموجودة في الدليل.')).toBe(
      'راجع الـ Steps: الموجودة في الدليل.',
    );
  });

  // One row with a null description must not take out the whole بلاغاتي list.
  it.each([
    ['', ''],
    [null, ''],
    [undefined, ''],
  ])('is total over %p', (input, expected) => {
    expect(stripModelSections(input)).toBe(expected);
  });
});
