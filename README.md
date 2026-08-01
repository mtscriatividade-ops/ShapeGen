# SVG Shape Studio

Editor e gerador de formas vetoriais SVG (React + TypeScript + Vite + Tailwind + Zustand).

## Rodar localmente

```
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Publicar no GitHub Pages (automático)

1. Crie um repositório novo no GitHub e suba este projeto:
   ```
   git init
   git add .
   git commit -m "SVG Shape Studio"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git push -u origin main
   ```

2. No GitHub, vá em **Settings → Pages**.

3. Em **"Build and deployment" → Source**, selecione **"GitHub Actions"**.

4. Pronto. O workflow em `.github/workflows/deploy.yml` já builda e publica
   automaticamente a cada push na branch `main`. Acompanhe o progresso na
   aba **Actions** do repositório.

5. Em alguns minutos o site estará no ar em:
   ```
   https://SEU-USUARIO.github.io/SEU-REPOSITORIO/
   ```

Não é necessário configurar `base` no `vite.config.ts` — já está definido
como caminho relativo (`./`), então funciona em qualquer subpasta,
independente do nome do repositório.

## Publicar manualmente (sem Actions)

Se preferir não usar o workflow:

```
npm run build
```

Isso gera a pasta `dist/`. Suba o **conteúdo** dela (não a pasta em si)
para a branch `gh-pages` do repositório (ou configure o Pages para servir
a pasta `/docs` a partir da `main`, copiando `dist/` para `docs/`).
