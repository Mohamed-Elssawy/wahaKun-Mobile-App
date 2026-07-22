import { act, create } from 'react-test-renderer';

import { RegistrationProvider, useRegistrationDraft } from '../RegistrationContext';

import type { RegistrationDraft } from '../RegistrationContext';
import type { ReactTestRenderer } from 'react-test-renderer';

/** Renders the hook and exposes its latest value for assertions. */
function renderDraft() {
  const captured: { current: ReturnType<typeof useRegistrationDraft> | null } = {
    current: null,
  };

  const Probe = () => {
    captured.current = useRegistrationDraft();
    return null;
  };

  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(
      <RegistrationProvider>
        <Probe />
      </RegistrationProvider>,
    );
  });

  return {
    get value() {
      if (!captured.current) {
        throw new Error('probe did not render');
      }
      return captured.current;
    },
    unmount: () => renderer.unmount(),
  };
}

describe('RegistrationContext', () => {
  it('starts empty', () => {
    expect(renderDraft().value.draft).toEqual({});
  });

  it('merges fields across steps rather than replacing the draft', () => {
    const probe = renderDraft();

    act(() => probe.value.update({ fullName: 'أحمد' }));
    act(() => probe.value.update({ email: 'a@b.com', password: 'secret' }));
    act(() => probe.value.update({ role: 'farmer' }));

    expect(probe.value.draft).toEqual<RegistrationDraft>({
      fullName: 'أحمد',
      email: 'a@b.com',
      password: 'secret',
      role: 'farmer',
    });
  });

  it('overwrites a field when a step is revisited', () => {
    const probe = renderDraft();

    act(() => probe.value.update({ fullName: 'first' }));
    act(() => probe.value.update({ fullName: 'second' }));

    expect(probe.value.draft.fullName).toBe('second');
  });

  /**
   * The point of this context: the password lives here instead of in
   * navigation params, and is dropped once it is no longer needed.
   */
  it('clears the draft, including the password, on reset', () => {
    const probe = renderDraft();

    act(() => probe.value.update({ email: 'a@b.com', password: 'secret' }));
    expect(probe.value.draft.password).toBe('secret');

    act(() => probe.value.reset());

    expect(probe.value.draft).toEqual({});
    expect(probe.value.draft.password).toBeUndefined();
  });

  it('throws when used outside the provider', () => {
    const Orphan = () => {
      useRegistrationDraft();
      return null;
    };

    // React logs the error boundary trace; silence it for this assertion.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Must be inside act(): React 19 surfaces render errors when the work
    // loop flushes, not at the create() call itself.
    expect(() =>
      act(() => {
        create(<Orphan />);
      }),
    ).toThrow('useRegistrationDraft must be used inside a RegistrationProvider');

    spy.mockRestore();
  });
});
