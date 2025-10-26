# Repository Guidelines

## Project Structure & Module Organization
- `miniprogram/` — WeChat Mini Program source.
  - `pages/<page>/` — page modules (`.wxml`, `.wxss`, `.js`, `.json`). Example: `pages/quiz/quiz.*`.
  - `utils/` — shared helpers (e.g., `utils/score.js`).
  - `data/` — static data (e.g., `data/questions.json`).
- `cloudfunctions/quickstartFunctions/` — Node.js cloud function (`index.js`, `package.json`).
- Root configs: `project.config.json` (DevTools), `project.private.config.json` (local only), `README.md`.

## Build, Test, and Development Commands
- Run cloud function locally deps:
  - `cd cloudfunctions/quickstartFunctions && npm install`
- Deploy cloud function (requires env vars set by your workflow):
  - `./uploadCloudFunction.sh` (uploads `quickstartFunctions`).
- Develop Mini Program:
  - Open repo root in WeChat DevTools, select the `project.config.json`, set cloud env, run Simulator.

## Coding Style & Naming Conventions
- Indentation: 2 spaces; UTF-8; LF line endings.
- JavaScript: camelCase variables/functions; PascalCase constructors. Prefer clear, descriptive names.
- Pages: directory and file names are lowercase, e.g., `pages/result/result.js`.
- Cloud functions: CommonJS (`require`, `module.exports`), keep functions small and pure.
- JSON: trailing commas not allowed; keep keys in stable order.

## Testing Guidelines
- No formal unit test setup. Validate features in WeChat DevTools (Simulator + real device when possible).
- Cloud functions: add lightweight checks/logs; consider placing future tests under `cloudfunctions/quickstartFunctions/test/` and wire with `npm test`.
- Manual checklist: page loads, navigation (`app.json` routes), storage (`wx.setStorageSync`), cloud calls succeed.

## Commit & Pull Request Guidelines
- Use Conventional Commits when possible:
  - Examples: `feat(quiz): add scoring thresholds`, `fix(result): correct risk label`, `chore(cf): bump wx-server-sdk`.
- PRs must include:
  - Summary of change, rationale, and scope.
  - Screenshots/GIFs for UI changes (Simulator captures).
  - Linked issue or task ID; test notes (devices, env ID used).

## Security & Configuration Tips
- Do not commit secrets. Keep environment IDs and private settings out of VCS (`project.private.config.json` stays local).
- Cloud init uses `cloud.DYNAMIC_CURRENT_ENV`; avoid hardcoding env IDs in client code.
- Avoid placing sensitive logic in the Mini Program; prefer cloud functions.

## Agent-Specific Instructions
- When adding a page: create `pages/<name>/<name>.{wxml,wxss,js,json}` and register it in `miniprogram/app.json`.
- When modifying data/contracts, update both the page and any cloud function consumers, and keep paths stable.
