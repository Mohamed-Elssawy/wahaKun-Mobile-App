// Expert-side half of __fixtures__/bidi.ts: author content under L-AS-AUTHORED, in the default set since real reports mix languages too.

/** An English report title, so E-01 and E-02 can be read with content and chrome agreeing. */
export const ENGLISH_CASE_TITLE = 'Silt build-up blocking the eastern distribution gate';

/** The AI's English analysis for that case. Not translated anywhere — it arrives as authored. */
export const ENGLISH_DIAGNOSIS =
  'Sediment has accumulated behind the gate to roughly two thirds of the channel depth, which is why flow drops sharply after the junction.';

export const ENGLISH_RECOMMENDATION =
  'Clear the silt trap, then flush the first twenty metres of the channel before reopening the gate.';

export const ENGLISH_REPAIR_STEPS: readonly string[] = [
  'Close the upstream valve and let the section drain.',
  'Remove the silt by hand; a pump will clog on this grain size.',
  'Reopen at half flow for an hour and watch the joint for seepage.',
];

/** The farmer's own words, in English, on an Arabic-chrome screen. */
export const ENGLISH_DESCRIPTION =
  'Water barely reaches my plot since the weekend. The gate looks clear from the top but nothing moves through it.';

/**
 * A Latin name beside the Arabic ones in the same list, which is the case E-01's identity row and
 * E-09's rows both have to lay out without either name pushing the timestamp off its edge.
 */
export const LATIN_FARMER_NAME = 'Youssef Barakat';

/**
 * The long-name edge case the fixture plan asks for, deliberately in Arabic: the card gives the
 * reporter one line beside a severity badge and a status chip, so this is what proves the
 * truncation rather than a name that happens to fit.
 */
export const LONG_ARABIC_FARMER_NAME = 'عبد الرحمن محمد عبد العظيم الشرقاوي الفيومي';

/** An English chat message from the farmer, so E-10's incoming bubble is read both ways. */
export const ENGLISH_CHAT_FROM_FARMER =
  'I can be there Thursday morning, but not before nine — the pump runs until then.';

/** And the expert's own reply in English, which renders outgoing with the ✓✓ receipt. */
export const ENGLISH_CHAT_FROM_EXPERT =
  'Thursday at nine works. I will bring the replacement gasket and check the joint while I am there.';

/** Mixed inside one message: a model number whose digits and letters both have to survive. */
export const MIXED_CHAT_MESSAGE =
  'البوابة الشرقية موديل Armtec AG-400، لو احتجت رقم القطعة هو 400-SG-12.';
