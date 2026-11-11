import { isReportOwner } from '../ownership';

/** Getting this wrong shows another farmer's tracker, and none of these cases fails to compile. */
describe('isReportOwner', () => {
  it('lets the farmer who filed it through', () => {
    expect(isReportOwner('u-1', 'u-1')).toBe(true);
  });

  it('keeps a different signed-in farmer out', () => {
    expect(isReportOwner('u-2', 'u-1')).toBe(false);
  });

  it('fails closed when nobody is signed in', () => {
    // useIdentity swallows a failed UserService call, so undefined is a normal state here.
    expect(isReportOwner(undefined, 'u-1')).toBe(false);
  });

  it('fails closed when the report does not say who filed it', () => {
    // Anything resolved from the map: MapResponseDto carries no reporterId.
    expect(isReportOwner('u-1', undefined)).toBe(false);
    expect(isReportOwner('u-1', '')).toBe(false);
  });

  it('does not treat two unknowns as a match', () => {
    expect(isReportOwner(undefined, undefined)).toBe(false);
    expect(isReportOwner('', '')).toBe(false);
  });
});
