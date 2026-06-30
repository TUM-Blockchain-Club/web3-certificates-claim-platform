# Certificate Types

## Change

Added role-aware certificates through `certificate_recipients.certificate_type`.

Supported values:

- `participant`
- `mentor`

Existing rows default to `participant`, so existing certificate IDs and verification URLs remain unchanged.

## PDF behavior

Generated PDFs now derive the statement line from the certificate type:

- `participant`: `for successfully completing Web3 Talents`
- `mentor`: `for being a mentor in`

The program name remains stored in `cohort`, currently `Blockchain Fundamentals 1`, and is rendered on the next line.

## Import behavior

Participant CSV replacement now only reads, upserts, and deletes rows with
`certificate_type = 'participant'`. This keeps future mentor certificates from
being removed by participant list maintenance.
