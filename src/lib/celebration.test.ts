import { describe, expect, it } from 'vitest';
import { makeStage } from '../test/fixtures';
import { isOfferStage } from './celebration';

describe('isOfferStage', () => {
  it('matches the default Offer stage', () => {
    expect(isOfferStage(makeStage({ name: 'Offer' }))).toBe(true);
  });

  it('is case- and whitespace-insensitive', () => {
    expect(isOfferStage(makeStage({ name: '  offer  ' }))).toBe(true);
    expect(isOfferStage(makeStage({ name: 'OFFER' }))).toBe(true);
  });

  it('does not match other stages', () => {
    expect(isOfferStage(makeStage({ name: 'Interviewing' }))).toBe(false);
    expect(isOfferStage(makeStage({ name: 'Offers Received' }))).toBe(false);
  });

  it('is false for undefined', () => {
    expect(isOfferStage(undefined)).toBe(false);
  });
});
