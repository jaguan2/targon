# Profile setup and chart-logic audit

Reviewed October 18, 2026. Product naming remains Star until the Targon rename.

Subsequent update: the [Friends tab](FRIENDS.md) now provides local friend
profiles and selected two-chart comparisons. References below to that feature
as future work describe the earlier profile audit.

## What exists and how it works

The app already had a real astronomical calculation pipeline. It calculates
geocentric ecliptic longitudes with Astronomy Engine, converts longitude into
one of twelve equal 30-degree tropical zodiac signs, and computes Ascendant,
Midheaven, and houses locally. It uses mean lunar nodes. Chiron is not supported.

The geocentric `GeoVector` → `Ecliptic` path, with `SunPosition` for the Sun,
matches the library's intended coordinate APIs. This matters: heliocentric
longitude would give the wrong chart. The engine's astronomical calculations
and the traditional interpretations applied to them are distinct layers.

Existing regression tests include an Einstein-chart fixture and a J2000 Sun
position. They pass. This pass also checks the handwritten Ascendant formula
using Astronomy Engine's separate ecliptic-to-equatorial and horizon transforms
for northern, southern, and equatorial locations. The calculated Ascendant is
on the eastern horizon in those cases. These checks improve confidence; they
are not an exhaustive validation of every house cusp, date, or polar geometry.

## Required profile information

| Information | Purpose | Missing-data behavior |
| --- | --- | --- |
| Optional name and pronouns | Personalize text; no calculation effect | Generic second-person copy |
| Birth date | Select the calendar day | Required; no prefilled sample date |
| Local clock time at birth | Determine the birth instant precisely | Assume noon and label planetary positions as estimates |
| Birth place, represented by latitude/longitude | Find the historical timezone and local horizon | Angles/houses unavailable; timezone can be supplied separately |
| IANA timezone override | Interpret a local time when place is missing, or correct a special case | Derived from coordinates; date-only data with neither place nor zone uses UTC with a visible warning |
| First/second clock occurrence | Disambiguate a repeated local time during a backward clock change | Ask for an explicit selection when the supplied time repeats |

Birthplace means where the person was born, not their current address. Use the
time recorded locally; a user should not manually add today's daylight-saving
offset. The coordinate lookup gives a timezone identifier; Luxon and the host's
Intl timezone database apply historical offsets for the birth date.

The app uses the Western **tropical** zodiac and currently requests Placidus
houses. It retains the existing whole-sign fallback when Placidus calculations
are unavailable at high latitudes. It now explicitly names the selected system
in the profile. Other astrology products may use sidereal signs, different
house systems, or true nodes, so their readings can legitimately differ.

## Profile implemented in this pass

- Profile and Compatibility navigation after onboarding.
- Sun, Moon, Rising/Ascendant, Descendant, Midheaven, and Imum Coeli summaries,
  followed by a full placement table with degrees, retrograde flags, and houses.
- The Descendant is calculated as Ascendant + 180 degrees; IC as Midheaven +
  180 degrees. Both are omitted without a known time and place. The user's
  “falling” sign is treated as the setting/Descendant sign; planetary *fall*
  is a different concept and is not implemented here.
- Editing name, pronouns, and birth details, with existing values prefilled.
  Going back between intake steps preserves the birth draft. Cancelling an
  edit preserves the current profile.
- Explicit opt-in to saving on the current device. Only inputs are serialized;
  charts are recalculated on restoration. Saved data is versioned and validated.
  Disabling the preference removes the saved copy; clearing resets the profile.
- Corrupt data and denied device storage produce visible recovery messages.
- An initial midnight palette and responsive profile layout. A full design
  overhaul is still separate work.

## Problems found and corrected

1. A sample date was prefilled and could become a user's chart accidentally.
2. The birth form rejected a place without a time, even though the place is
   useful for the timezone. Unknown time now works with a known place.
3. A time without a place silently became UTC. The form now requires either
   a birth place or an explicit timezone for a supplied local time.
4. Missing-time Moon positions were presented without an estimate label even
   though they were calculated at noon. Date-only placements and compatibility
   results now disclose that assumption. No sign near a boundary is guaranteed.
5. Luxon can shift nonexistent clock times during a forward DST change. Those
   inputs are now rejected. Repeated times require an explicit occurrence.
6. Coordinates were not validated in the chart engine and partial coordinates
   could be discarded in the form. Both layers now validate the relevant data.
   Exact geographic poles are rejected for time-dependent horizon angles.
7. A restart discarded in-memory data, and there was no profile editing or
   optional persistence. The new Profile tab provides both.

## Compatibility logic: scope and limits

`compatibility.ts` scores a user's placements against a generic target sign.
Aspect separation, elements, and modalities feed an explicit custom score;
overall, romantic, and friendship modes use different placement weights.
Missing placements cause the remaining weights to be renormalized.

This implementation is consistent with its tested rules, but those rules are
product choices. They are not calibrated probabilities or an independently
validated predictor of relationship outcomes. Despite using precise degrees
for chart calculation, the current compatibility model uses **sign-level**
aspects, not full degree/orb synastry between two charts. The UI now explains
that distinction. Friend profiles and person-to-person scoring remain future
work. Adding Descendant and IC to the profile does not alter the current weights.

## Verification and remaining work

Tests cover chart reference fixtures, independent horizon checks, angle
opposition, summer/winter timezone conversion, missing-time location lookup,
DST gaps/repetitions, invalid input, saved-data validation, and the profile
lifecycle including edit/cancel/save/reload/clear and storage failures.

The intake still has a limited offline city list plus manual coordinates.
Before broad release, expand place search and check city-center precision.
Historical local mean time before standardization can differ from a region's
IANA history; the app warns for pre-1900 births using an inferred timezone.
Historical timezone quality also depends on the operating system/browser data.
Unknown time is currently represented by a noon estimate, rather than a range
of possible signs across the day. Further independent chart fixtures across
dates, hemispheres, and house cusps would strengthen astronomical validation.

Browser interaction tests use jsdom; a live-browser visual review and a fresh
Windows installer verification were not performed in this pass. The installed
Electron 43 tooling declares Node >=22.12, while this environment runs Node
20.20.2. Web tests/build run successfully here; use a supported Node runtime for
desktop packaging.

## Primary references

- [Astronomy Engine documentation and validation](https://github.com/cosinekitty/astronomy)
  — ephemeris capabilities, coordinates, and validation methodology. Installed
  package declarations were also checked for the exact transform APIs used.
- [Astrodienst: birth time](https://www.astro.com/faq/fq_de_time_e.htm)
  — local time, timezone history, and unknown-time handling.
- [Astrodienst: Ascendant](https://www.astro.com/astrowiki/en/Ascendant)
  and [Descendant](https://www.astro.com/astrowiki/en/Desc)
  — rising and setting points and their opposition.
- [Astrodienst: Imum Coeli](https://www.astro.com/astrowiki/en/Imum_Coeli)
  — IC opposite Midheaven.
- [Astrodienst: tropical zodiac](https://www.astro.com/astrowiki/en/Tropical_Zodiac)
  — equinox-based zodiac convention.
- [Luxon: getPossibleOffsets](https://moment.github.io/luxon/api-docs/index.html#datetimegetpossibleoffsets)
  — detecting repeated local times around daylight-saving changes.
