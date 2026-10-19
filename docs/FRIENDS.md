# Friends and two-chart comparisons

Implemented October 18, 2026. The product is now named Targon, with existing
local friend and profile storage preserved through the rename.

## User flow

After creating their own profile, the user can open Friends and add someone by
name or nickname and birth date. Birth time, place, and pronouns are optional.
The same timezone, coordinate, and daylight-saving validation used for the
user's profile applies to friends. Moving back in the form preserves inputs.

Adding a friend opens their comparison. Each card offers Compare, Edit, and
Remove. Editing preserves the identifier and updates the existing record.
Removal has a single-level Undo action; restoring puts the record back in its
original position. The selected friend and comparison lens remain selected
while navigating between the main tabs. Editing the owner's profile recalculates
the comparisons against the new chart.

The detail view shows selected placement pairs, the aspect or absence of an
in-orb aspect, the actual orb for known-time comparisons, each pair's effective
weight, and the model index. The friend's natal placements and chart warnings
are available in an expandable readout. The owner's chart caveats are also
accessible from the comparison.

## Persistence

Friends stay in memory by default. The existing “Remember profile on this
device” preference saves both the owner and friends locally. No account,
friend invitation, message, backend, or birth-data upload is involved.

The original storage key remains stable, with a version 2 payload containing
the owner and friend inputs. Version 1 single-person saves load with an empty
friends list. Only birth inputs, profile text, and stable friend IDs are stored;
charts are recalculated. Invalid or duplicate IDs and malformed profiles are
rejected. If the friend collection is damaged but the owner remains valid, the
owner can still open their profile; the UI warns about the friends and leaves
the saved copy unchanged until a subsequent save.

Storage failures leave edits usable for the session and explicitly report that
the saved copy was not updated. Disabling remember removes the entire saved
workspace while preserving the current in-memory profiles. Clearing the owner's
profile also clears friends, and the Profile page explains this.

## Comparison model

This is an initial, transparent comparison of selected inter-chart placements,
not a complete synastry report. The existing twelve-sign exploration is kept
separate. Synastry compares relationships between points from two charts;
[Astrodienst's synastry overview](https://www.astro.com/astrowiki/en/Synastry)
describes that practice. The numerical weights and index here are product
choices, not claims derived from that source or calibrated relationship odds.

| Pair family | Overall | Friendship | Romantic |
| --- | ---: | ---: | ---: |
| Sun–Sun | 22% | 15% | 10% |
| Moon–Moon | 18% | 15% | 20% |
| Sun–Moon, both directions | 20% | 15% | 20% |
| Mercury–Mercury | 15% | 30% | — |
| Sun–Mercury, both directions | — | 15% | — |
| Venus–Venus | 10% | — | 15% |
| Venus–Mars, both directions | — | — | 25% |
| Sun–Rising, both directions | 15% | 10% | 10% |

Each cross-body family's weight is split equally between both directions.
Unavailable pairs are omitted and remaining weights normalized. Swapping the
two people therefore preserves the score even when placements are missing.

### Known birth times

`synastry.ts` uses the existing tested `findAspect` function on actual
longitudes. It includes conjunction, semi-sextile, sextile, square, trine,
quincunx, and opposition, using the existing aspect table's orbs and base values.
These defaults are explicit model choices; they are not universal synastry
standards. The UI does not reuse the whole-sign explanatory language for
degree-level contacts, because an in-orb aspect can cross sign boundaries.

An absent contact contributes neutral 50. An in-orb contact contributes:

`pair value = 50 + (aspect base value - 50) × aspect strength`

Strength is 1 at exact and falls linearly to 0 at the allowed orb boundary.
The index is the weighted average of available pair values, rounded to one
decimal. No available pairs produces an unavailable index, not a fabricated
zero. Scores are displayed as a custom index out of 100, without a percent sign.

### Unknown birth time

If either chart has an unknown time, the entire comparison falls back to the
existing sign-pair model using noon reference positions. It is clearly labelled
provisional, including the possibility that the Moon or another cusp-adjacent
placement changes sign. The breakdown shows sign names rather than apparent
degree precision. Rising-dependent pairs remain absent when unavailable.

The estimated sign model and degree model use different scoring rules. Adding
a birth time can change both the available placements and the scoring method;
their index values are not directly interchangeable. The UI explains this.

## Verification and limits

Domain tests cover symmetry, both directions of cross-body pairs, real-degree
differences within the same sign, cross-cusp conjunctions, orb fading, missing
data, estimated fallback, mode-specific contributions, score bounds, and storage
migration/validation. Interaction tests cover creating, editing, cancelling,
comparing, switching lenses, navigating tabs, saving/reloading, remove/undo,
unknown times, storage failures, damaged friend data, owner edits, and clearing.

The current scope excludes invitations, network accounts, syncing, house
overlays, outer-planet contacts in the index, composite charts, and a new
two-person chart visualization. The expandable readout still includes the
friend's available natal planets. Unknown-time uncertainty is a labelled noon
estimate rather than a range over the day. Browser interaction checks use
jsdom; they do not replace a live-browser visual review or desktop installer
verification.
