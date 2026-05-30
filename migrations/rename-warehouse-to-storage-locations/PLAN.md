Migration plan: rename 'warehouse(s)' -> 'storage-location(s)'

Goal
- Rename domain term 'warehouse' to 'storage-location' across frontend and backend while preserving backward compatibility during rollout.

High-level steps
1. Inventory & mapping: collect all occurrences and create an old->new mapping (done).
2. Frontend safe changes: add new routes/pages, update labels, and keep legacy aliases (completed).
3. Backend safe changes: add alias endpoints and update constants; do not remove legacy keys yet.
4. Permission strings: add new permission constants and accept legacy permission names during auth checks.
5. Models & DB: keep Mongoose collection/name unchanged; add new field aliases in models if renaming fields is necessary; prefer leaving DB fields intact and mapping at model layer.
6. Validators & seeds: update validators/schemas and seed scripts to use new names; also write compatibility code to accept legacy payloads.
7. Tests & CI: update tests, add integration tests for both legacy and new endpoints.
8. Rollout: phased deploy — deploy backend with aliases, deploy frontend, migrate data/DB fields if desired, then remove legacy aliases in a later release.

Notes & Risks
- Permissions and Casbin policies must accept both old and new resource strings during migration to avoid access breaks.
- Renaming DB collections or schema names is high-risk; recommend model-layer aliasing instead.
- Coordinate frontend and backend deployment to avoid 403/401 issues.

Next actions (I'll do):
- Generate a file-by-file patch set for backend constants, routes, and permission aliases (preview before apply).
- Add compatibility wrappers in auth/permission checks to accept both resource names.
- Prepare DB migration script template (if you want to rename collection/fields later).

Contact me if you prefer targeted step-by-step patches instead of repo-wide changes.
