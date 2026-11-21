import { I18nManager } from 'react-native';

import type { ForcedLocale } from '@/config/env';

import { applyDirection, directionFor, ltrIsolate } from '../direction';

import type AsyncStorage from '@react-native-async-storage/async-storage';

type Boot = {
  i18n: typeof import('../locale');
  storage: typeof import('../storage');
  store: jest.Mocked<typeof AsyncStorage>;
};

/** Re-imports from a fresh registry since locale.ts reads FORCE_LOCALE at module init; require, not import(), since Jest has no ESM loader. */
function bootWith(forced: ForcedLocale | null): Boot {
  jest.resetModules();
  jest.doMock('@/config/env', () => ({ FORCE_LOCALE: forced }));

  return {
    store: require('@react-native-async-storage/async-storage').default,
    storage: require('../storage'),
    i18n: require('../locale'),
  };
}

describe('directionFor', () => {
  it('derives direction from the locale rather than storing one', () => {
    expect(directionFor('ar')).toBe('rtl');
    expect(directionFor('en')).toBe('ltr');
  });
});

describe('ltrIsolate', () => {
  it('scopes an LTR island so a surrounding Arabic run cannot re-order it', () => {
    // FSI ... PDI. The bare value is what renders "+20" as "20+" inside an Arabic sentence.
    expect(ltrIsolate('+20')).toBe('⁨+20⁩');
    expect(ltrIsolate(86)).toBe('⁨86⁩');
  });
});

describe('applyDirection', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // The whole contract: each locale forces its own direction, and allowRTL is unconditional.
  it('hands direction to the platform, so one flag mirrors every layout', () => {
    const allowRTL = jest.spyOn(I18nManager, 'allowRTL').mockImplementation(() => {});
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {});

    applyDirection('ar');
    applyDirection('en');

    expect(forceRTL).toHaveBeenCalledTimes(2);
    expect(forceRTL).toHaveBeenNthCalledWith(1, true);
    expect(forceRTL).toHaveBeenNthCalledWith(2, false);

    // Never conditional: pinning it off is what double-mirrored an Arabic-locale device.
    expect(allowRTL).toHaveBeenCalledTimes(2);
    expect(allowRTL).toHaveBeenNthCalledWith(1, true);
    expect(allowRTL).toHaveBeenNthCalledWith(2, true);
  });
});

// The four boot states §16.10 names; every one has to end on a locale, never on a throw.
describe('resolveLocale', () => {
  it('reads the persisted locale', async () => {
    const { i18n, store } = bootWith(null);
    store.getItem.mockResolvedValue('en');

    await expect(i18n.resolveLocale()).resolves.toBe('en');
    expect(i18n.locale()).toBe('en');
    expect(i18n.isRTL()).toBe(false);
  });

  it('defaults to Arabic when nothing is persisted, which is a first install', async () => {
    const { i18n } = bootWith(null);

    await expect(i18n.resolveLocale()).resolves.toBe('ar');
    expect(i18n.locale()).toBe('ar');
    expect(i18n.isRTL()).toBe(true);
  });

  it('still boots on a thrown storage read', async () => {
    const { i18n, store } = bootWith(null);
    store.getItem.mockRejectedValue(new Error('AsyncStorage unavailable'));

    await expect(i18n.resolveLocale()).resolves.toBe('ar');
    expect(i18n.locale()).toBe('ar');
  });

  it('ignores a persisted locale this build no longer has', async () => {
    const { i18n, store } = bootWith(null);
    store.getItem.mockResolvedValue('fr');

    await expect(i18n.resolveLocale()).resolves.toBe('ar');
  });

  it('lets FORCE_LOCALE override the persisted choice without reading it', async () => {
    const { i18n, store } = bootWith('en');
    store.getItem.mockResolvedValue('ar');

    await expect(i18n.resolveLocale()).resolves.toBe('en');
    expect(i18n.locale()).toBe('en');
    expect(store.getItem).not.toHaveBeenCalled();
  });

  // Must hold before resolveLocale runs: typography reads the locale at module init.
  it('applies FORCE_LOCALE at module init, not when the boot window resolves', () => {
    expect(bootWith('en').i18n.locale()).toBe('en');
  });

  it('renders pseudo as an English-shaped locale, so it is not a third Locale', () => {
    const { i18n } = bootWith('pseudo');

    expect(i18n.locale()).toBe('en');
    expect(i18n.isPseudo()).toBe(true);
    expect(i18n.isRTL()).toBe(false);
  });
});

describe('setLocale', () => {
  it('moves the store without persisting, so §16.5 can fail the write on its own', () => {
    const { i18n, store } = bootWith(null);

    i18n.setLocale('en');

    expect(i18n.locale()).toBe('en');
    expect(i18n.direction()).toBe('ltr');
    expect(store.setItem).not.toHaveBeenCalled();
  });
});

describe('storeLocale', () => {
  it('propagates a failed write rather than reporting a saved choice', async () => {
    const { storage, store } = bootWith(null);
    store.setItem.mockRejectedValueOnce(new Error('disk full'));

    await expect(storage.storeLocale('en')).rejects.toThrow('disk full');
  });

  it('writes the locale under one key', async () => {
    const { storage, store } = bootWith(null);

    await storage.storeLocale('en');

    expect(store.setItem).toHaveBeenCalledWith('wk.i18n.locale', 'en');
  });
});
