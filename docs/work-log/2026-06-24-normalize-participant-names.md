# 2026-06-24 Normalize Participant Names

## Change

Added and applied migration
`202606240001_normalize_participant_names.sql`.

The migration creates:

- `normalize_certificate_participant_name(text)`;
- `set_normalized_certificate_participant_name()`;
- `normalize_certificate_participant_name` trigger on
  `certificate_recipients`.

The trigger normalizes `participant_name` before insert or update by trimming
outer spaces, collapsing repeated whitespace, lowercasing the input, and
capitalizing word segments.

## Existing Data

The migration updated three existing rows:

- `MOHAMED ELHEFNAWY` to `Mohamed Elhefnawy`;
- `sebastian Steiner` to `Sebastian Steiner`;
- `wassim mezghanni` to `Wassim Mezghanni`.

## Verification

Checked that no row in `certificate_recipients` differs from
`normalize_certificate_participant_name(participant_name)` after the migration.

