# Vagas abertas: Consultor Comercial

Página de vagas da Franquia Embracon Anália Franco. A pessoa conhece a vaga, preenche a
ficha de quatro perguntas, escolhe para quem enviar e o WhatsApp abre com a mensagem pronta. Não tem servidor, banco de
dados nem etapa de build: é HTML, CSS e JavaScript puro.

## Arquivos

```
index.html          a página, os textos e as perguntas da ficha
css/tokens.css      cores, fonte e medidas da marca
css/base.css        tipografia, logotipo, botões, barra fixa e rodapé
css/hero.css        abertura (logo se revelando) e hero dividido na diagonal
css/sections.css    faixa em movimento, sobre nós, benefícios, como funciona
css/form.css        ficha de candidatura
css/motion.css      entradas e efeitos ligados à rolagem
js/config.js        número do WhatsApp e texto de abertura da mensagem
js/intro.js         abertura e entrada do hero
js/motion.js        movimento ligado à rolagem e ao mouse
js/form.js          validação, montagem da mensagem e envio
assets/             logotipo, símbolo, foto, fonte, favicon e imagem de compartilhamento
```

## Publicar no GitHub Pages

1. Crie um repositório e suba todos os arquivos desta pasta na raiz dele.
2. No repositório, abra Settings > Pages.
3. Em "Build and deployment", escolha "Deploy from a branch", branch `main`, pasta `/ (root)` e salve.
4. Em um ou dois minutos a página fica em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

Abra sempre pelo endereço publicado ou por um servidor local (por exemplo
`python3 -m http.server` dentro da pasta). Aberta direto pelo arquivo, a fonte pode não carregar.

## Trocar os números do WhatsApp

A página tem dois contatos, e os dois recebem fichas: `whatsapp` e `whatsappAdm`, em `js/config.js`
(55 + DDD + número, só os dígitos). Na ficha há um botão de envio para cada um; depois de enviar
para um, a tela seguinte oferece enviar a mesma ficha também para o outro. O WhatsApp só abre uma
conversa por vez, então não existe envio para os dois em um toque só.

Os números escritos na página são atualizados sozinhos. O `index.html` também traz os números
escritos como reserva para quem abre sem JavaScript; vale trocar lá também (busque por `wa.me`).
O nome e o cargo de cada contato ficam no `index.html`: busque por `contato-quem` (hero, ficha e
rodapé), `data-enviar` (botões de envio) e `data-nome` (tela depois do envio).

## Mudar as perguntas da ficha

As perguntas ficam no `index.html`, dentro de `<form id="ficha-form">`.
Cada bloco com `data-field` vira uma linha da mensagem:

- `data-rotulo`: nome da linha na mensagem (ex.: "Nome").
- `data-falta`: como o campo aparece no aviso "Falta ...". Sem esse atributo o campo é opcional.
- `data-kind`: `text`, `phone`, `choice` (opções de tocar) ou `note` (texto livre).

Para adicionar uma opção, copie uma linha `<label class="opt">` e troque o `id`, o `value` e o texto.
Para adicionar uma pergunta, copie um bloco inteiro e troque `data-field`, `id` e `name` por um nome novo.
No topo da ficha há um paralelogramo por pergunta obrigatória: ao adicionar ou tirar uma pergunta,
ajuste a quantidade de `<span class="seg">` no `index.html` e o número de colunas de `.steps-nav` em `css/form.css`.

## Trocar a foto e o logotipo

- Foto do hero: `assets/consultor.webp` (recorte com fundo transparente, 450 x 1251 px).
- Logotipo: `assets/logo-branco.png` e `assets/logo-cor.png`. A abertura usa o logotipo em três
  camadas do mesmo tamanho, em `assets/logo/` (mão, "Consórcio" e "Embracon"), para animar cada parte.

## Movimento

Todo o movimento respeita a preferência "reduzir movimento" do aparelho: nesse caso a página
aparece parada e completa. Os tempos da abertura ficam em `js/intro.js` (constantes no começo do arquivo).

## Prévia do link no WhatsApp e nas redes

A imagem da prévia é `assets/og.jpg`, já apontada para o endereço publicado
(`https://solutionsnovaai-bit.github.io/vagas-embraconanaliafranco/`). Se a página mudar de endereço, troque `og:url` e `og:image` no `index.html`.

## Fonte

A fonte Archivo vai junto do projeto em `assets/fonts/`, sob a licença SIL Open Font License
(texto em `assets/fonts/LICENCA-OFL.txt`).
