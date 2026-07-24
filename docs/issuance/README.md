# Issuance record conventions

Committed issuance documentation in this public repository must remain general
and privacy-safe. It may describe schema versions, validation rules, commands,
and the frozen-manifest boundary. It must not contain recipient names, emails,
Credential IDs, destination addresses, private artifact paths, live batch
counts, operational status, or customer-specific handoff notes.

Concrete batch records belong below ignored `private/docs/issuance/` and in the
restricted operational archive. A private record should capture the Manifest
checksum, matching Prepared Issuance checksum, contract address, counts, mint
status, and receipt-import status without being committed here.

Public chain deployments and privacy-safe batch records may be committed in the
private sibling `w3t-nfts` repository. Private manifests, Prepared Issuances,
receipts, keystores, and passwords never belong in either Git repository.
