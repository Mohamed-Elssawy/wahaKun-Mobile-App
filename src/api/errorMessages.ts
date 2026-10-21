export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'badRequest'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'rateLimited'
  | 'server'
  | 'badGateway'
  | 'unavailable'
  | 'unknown';

export const CODE_MESSAGES: Record<string, string> = {
  VALIDATION_FAILED: 'بعض البيانات المدخلة غير صحيحة، راجعها وحاول مرة أخرى',
  BAD_REQUEST: 'الطلب غير صالح، حاول مرة أخرى',
  INVALID_OPERATION: 'لا يمكن تنفيذ هذا الإجراء حالياً',
  NOT_FOUND: 'العنصر المطلوب غير موجود',
  CONFLICT: 'هذا العنصر موجود بالفعل',
  SERVER_ERROR: 'حدث خطأ في الخادم، حاول مرة أخرى لاحقاً',
  DATABASE_ERROR: 'تعذر الوصول إلى قاعدة البيانات حالياً، حاول لاحقاً',
  DEPENDENCY_UNAVAILABLE: 'إحدى خدمات النظام غير متاحة الآن، حاول بعد قليل',
  REQUEST_CANCELLED: 'تم إلغاء الطلب',
  UNAUTHORIZED: 'انتهت جلستك، سجّل الدخول مرة أخرى',
  TOKEN_MISSING: 'يجب تسجيل الدخول أولاً',
  TOKEN_EXPIRED: 'انتهت جلستك، سجّل الدخول مرة أخرى',
  TOKEN_INVALID: 'جلسة غير صالحة، سجّل الدخول مرة أخرى',
  FORBIDDEN: 'ليست لديك صلاحية لهذا الإجراء',
  INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  ACCOUNT_NOT_APPROVED: 'حسابك قيد المراجعة ولم تتم الموافقة عليه بعد',
  ACCOUNT_BLOCKED: 'تم إيقاف حسابك، تواصل مع الدعم',
  USER_NOT_FOUND: 'لا يوجد حساب مسجّل بهذه البيانات',
  USER_ALREADY_EXISTS: 'يوجد حساب مسجّل بهذا البريد أو رقم الهاتف بالفعل',
  REGISTRATION_FAILED: 'تعذر إنشاء الحساب، راجع البيانات وحاول مرة أخرى',
  INVALID_REFRESH_TOKEN: 'انتهت جلستك، سجّل الدخول مرة أخرى',
  PASSWORD_RESET_FAILED: 'تعذر إعادة تعيين كلمة المرور، قد يكون الرابط منتهي الصلاحية',
  FIREBASE_TOKEN_INVALID: 'تعذر التحقق من رقم الهاتف، أعد إرسال الرمز',
  UNSUPPORTED_FILE_TYPE: 'نوع الملف غير مدعوم، استخدم صورة JPG أو PNG',
  PHOTO_REQUIRED: 'يجب إرفاق صورة للمشكلة',
  PHOTO_REJECTED: 'لم نتمكن من رؤية مشكلة واضحة في الصورة',
  PHOTO_POOR_QUALITY: 'الصورة غير واضحة، التقط صورة أوضح في إضاءة أفضل',
  PHOTO_NOT_IRRIGATION: 'الصورة لا تظهر مشكلة ري واضحة',
  PHOTO_LOW_CONFIDENCE: 'لم يتمكن النظام من تحديد المشكلة بثقة، التقط صورة أوضح',
  PHOTO_UNCERTAIN: 'المشكلة غير واضحة في الصورة، التقط صورة أقرب وأوضح',
  ISSUE_PRIORITY_TOO_LOW: 'المشكلة تبدو بسيطة، ولا يحتاج هذا البلاغ إلى متابعة',
  ISSUE_NOT_FOUND: 'البلاغ غير موجود أو تم حذفه',
  AI_SERVICE_UNAVAILABLE: 'خدمة التشخيص الذكي غير متاحة الآن، سيُعاد الإرسال تلقائياً',
  AI_SERVICE_ERROR: 'تعذر تحليل الصورة حالياً، حاول مرة أخرى',
  STORAGE_SERVICE_UNAVAILABLE: 'تعذر رفع الصورة حالياً، سيُعاد الإرسال تلقائياً',
  MAP_ISSUE_NOT_FOUND: 'لم يتم العثور على البلاغ على الخريطة',
  COMMENT_REJECTED: 'لم يتم نشر التعليق لأنه يخالف إرشادات المجتمع',
};

export const STATUS_MESSAGES: Record<number, string> = {
  400: 'الطلب غير صالح، راجع البيانات وحاول مرة أخرى',
  401: 'انتهت جلستك، سجّل الدخول مرة أخرى',
  403: 'ليست لديك صلاحية لهذا الإجراء',
  404: 'الخدمة أو العنصر المطلوب غير موجود',
  405: 'هذا الإجراء غير مدعوم',
  408: 'انتهت مهلة الطلب، حاول مرة أخرى',
  409: 'تعارض في البيانات، ربما تم تنفيذ هذا الإجراء من قبل',
  413: 'حجم الملف كبير جداً',
  415: 'نوع الملف غير مدعوم',
  422: 'تعذر معالجة البيانات المرسلة',
  429: 'محاولات كثيرة، انتظر قليلاً ثم حاول مرة أخرى',
  500: 'حدث خطأ في الخادم، حاول مرة أخرى لاحقاً',
  502: 'الخادم غير متاح مؤقتاً، حاول بعد قليل',
  503: 'الخدمة غير متاحة حالياً، حاول بعد قليل',
  504: 'استغرق الخادم وقتاً طويلاً، حاول مرة أخرى',
};

export const NETWORK_MESSAGE = 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى';
export const TIMEOUT_MESSAGE = 'انتهت مهلة الاتصال، حاول مرة أخرى';
export const GENERIC_MESSAGE = 'حدث خطأ غير متوقع، حاول مرة أخرى';

export function kindForStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'badRequest';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'notFound';
    case 409:
      return 'conflict';
    case 422:
      return 'validation';
    case 429:
      return 'rateLimited';
    case 502:
      return 'badGateway';
    case 503:
    case 504:
      return 'unavailable';
    default:
      return status >= 500 ? 'server' : 'unknown';
  }
}

export function isDisplayableArabic(text: string | undefined): text is string {
  if (!text) return false;
  if (text.length > 200 || /exception|stack|at \w+\.|sql|connection string/i.test(text))
    return false;
  return /[\u0600-\u06FF]/.test(text);
}

export function resolveUserMessage(
  code: string | undefined,
  status: number,
  serverMessage: string | undefined,
): string {
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];
  if (isDisplayableArabic(serverMessage)) return serverMessage;
  return STATUS_MESSAGES[status] ?? GENERIC_MESSAGE;
}
