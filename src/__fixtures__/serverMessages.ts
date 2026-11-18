// Not copy: SPEC §16.8 says server text is not an interface. Lives here since .eslintrc.js exempts __fixtures__ from the Arabic-literal rule.

/** An ordinary Arabic server message - the kind the deployment actually sends. */
export const ARABIC_SERVER_MESSAGE = 'هذا العنصر موجود بالفعل';

/** The same thing in English. The deployment sends these too, which is the whole problem. */
export const ENGLISH_SERVER_MESSAGE = 'That item already exists';

/** Arabic quoting a Latin part number: a majority rule reads this as English, wrongly. */
export const ARABIC_QUOTING_LATIN = 'المضخة موديل Grundfos SP 5A-9 بتفصل';

/** Arabic with a leaked exception word, which must be refused whatever the locale. */
export const ARABIC_WITH_EXCEPTION = 'حدث exception في الخادم';

/** Arabic long enough to be prose rather than copy. */
export const ARABIC_TOO_LONG = 'ا'.repeat(201);

/**
 * Stand-in catalogue values for the two keys api/errorMessages.ts resolves in those tests. The
 * CONFLICT code and the 409 status are deliberately different copy - one says the item already
 * exists, the other that something changed underneath - so a test can tell which branch ran.
 */
export const ERROR_CATALOGUE_AR = {
  'errors.api.alreadyExists': 'هذا العنصر موجود بالفعل',
  'errors.api.conflict': 'تعارض في البيانات',
};

export const ERROR_CATALOGUE_EN = {
  'errors.api.alreadyExists': 'That already exists.',
  'errors.api.conflict': "There's a conflict in the data",
};
