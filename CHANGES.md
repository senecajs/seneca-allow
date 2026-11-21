# Changes

## 2.0.0 2026-11-21

First entry of this change log. Earlier versions are on npm and in the
git history.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (was `>=3`).
  Seneca 3 users stay on `@seneca/allow@1`.
* Node.js 24 or later (`engines.node` `>=24`).
* The peer dependency `seneca-promisify` is removed. Seneca 4 has
  promises built in and deprecates the promisify plugin (D4). Do not
  load it.
* Fixed the entry point. 1.0.0 named `dist/Allow.js` and
  `dist/Allow.d.ts` as `main` and `types` but shipped `dist/allow.js`,
  so `require('@seneca/allow')` failed on case-sensitive file systems
  such as Linux. `main` and `types` now name `dist/allow.js` and
  `dist/allow.d.ts`, and the build output in `dist/` is committed.
