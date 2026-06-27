# Diário de Liberdade

Aplicativo web (PWA) de apoio e registro para mulheres em situação de violência.
Funciona **offline** e guarda tudo **apenas no aparelho** — não há servidor.

## Como funciona

É um site estático: basta abrir o `index.html` num navegador. Não precisa
instalar nada, nem rodar nenhum comando de build. Para publicar, é só subir
todos os arquivos para um serviço de páginas estáticas (GitHub Pages, Vercel,
Netlify) ou abrir o `index.html` direto.

## Estrutura dos arquivos

```
index.html            → estrutura das telas (HTML)
css/
  styles.css          → todo o visual
js/                   → o código, separado por responsabilidade
  core.js             → variáveis globais e hash de PIN  (carrega 1º)
  storage.js          → salvar/ler dados, backup, sanitização
  security.js         → PIN, PIN de pânico, sigilo, saída de emergência, auto-lock
  navigation.js       → navegação entre telas e abas
  diary.js            → diário: percepção, humor, escala, mapa do corpo, histórico
  juridico.js         → relatório jurídico, linha do tempo, exportar PDF
  audio.js            → gravador de áudio
  support.js          → rede de apoio, mapa, checklist, afirmações, ajuda, QR
  features.js         → onboarding, modo leve, jornada guiada, conquistas
  app.js              → exportação/backup, service worker, init  (carrega por último)
```

## Importante: a ORDEM dos scripts

Os arquivos em `js/` são carregados em sequência no fim do `index.html`.
A ordem **importa**: `core.js` precisa vir primeiro (define as variáveis que
todos usam) e `app.js` por último (inicia o app). Se você adicionar um script
novo, coloque-o respeitando essa ordem.

## Privacidade e segurança

- Todos os dados ficam só no navegador do aparelho (localStorage).
- O PIN é guardado como hash (SHA-256), nunca em texto puro.
- Há PIN de pânico (abre um modo disfarçado) e saída de emergência rápida.
- O backup **não** inclui o PIN, por segurança.

## Publicando no GitHub Pages

1. Suba todos os arquivos para o repositório (mantendo as pastas `css/` e `js/`).
2. Em *Settings → Pages*, escolha a branch e a pasta raiz.
3. O endereço gerado é o link do app.
