# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Deploy to Vercel

The workflow in `.github/workflows/vercel-deploy.yml` deploys the app to Vercel after every push to `main`. It can also be started manually from the GitHub Actions tab.

Add this repository secret in GitHub under **Settings > Secrets and variables > Actions**:

- `VERCEL_TOKEN`: a Vercel access token

The workflow is linked to the existing `sm-tracking` Vercel project and passes its verified team and project IDs directly. The Vercel project should use the repository root as its project directory. The workflow runs `npm ci`, `npm run build`, and then deploys the generated Vite output as a production deployment.
