# Tábula Redonda

Plataforma de sistemas de RPG, fichas e bibliotecas. Roda **no navegador**,
sem conta, sem servidor, sem banco. Dois cliques no `index.html` e abre.

## As páginas

| Página | O que é |
|---|---|
| `index.html` | **o painel**: trilho lateral, busca, carrossel, atalhos e catálogo |
| `sistema.html?s=…` | a página de um sistema: banner, categorias e biblioteca |
| `compendio.html?s=…` | a biblioteca pesquisável daquele sistema |
| `loja.html` | o catálogo de materiais, e onde se resgata |
| `fichas.html` | a estante: suas fichas salvas |
| `criar.html` | montador de ficha do **Ressonância** |
| `criar-saa.html` | montador de ficha do **Saa** |
| `ficha.html?id=…` | a ficha de jogo do Ressonância, com o rolador de dados |

**O trilho lateral aparece em todas elas**, e `js/nav.js` marca sozinho o
destino atual — e carrega o sistema aberto nos links de Sistemas e Compêndio,
pra você não cair no Ressonância vindo do Saa.

## Os sistemas

| Sistema | Situação |
|---|---|
| **Ressonância 26.1** | compêndio com 90 entradas e montador de ficha completo |
| **Saa 26.1** | compêndio com 32 entradas e montador de ficha completo |
| **Feiticeiros & Maldições 2.5.2** | página e estrutura prontas; compêndio e ficha ainda não |

O Saa é do Japê, Pedro Henrique e Luiz Fernando. O F&M é do Projeto Onigiri
(Setsugiri e Parker), fan project gratuito de Jujutsu Kaisen — universo de
Gege Akutami.

### Obra de terceiros

O F&M está marcado com `externo:true` em `js/sistemas.js`. Isso faz a Loja
dizer que **o arquivo fica com o autor**: o site aponta pro material oficial
em vez de hospedar um PDF de 370 páginas que não é seu. Vale manter assim.

## A Loja e a biblioteca

Tudo é gratuito, e **Resgatar não cobra nada**. Ele existe pra separar "o
catálogo tem" de "eu tenho": sem isso a página do sistema listava livro que
ninguém pegou. Material não resgatado manda pra Loja; resgatado abre o
compêndio. A biblioteca fica em `localStorage`, chave `tabula:biblioteca`.

## A regra de ouro

**Cada sistema tem um arquivo de regras, e nada vive fora dele.**

- `js/regras.js` → Ressonância
- `js/saa.js` → Saa

O compêndio **não digita entrada nenhuma**: `js/compendio.js` monta as 90 do
Ressonância e as 32 do Saa lendo esses arquivos. Mudou a regra no livro,
mudou no compêndio, no montador e na ficha ao mesmo tempo.

### ⚠ Os `id` são chave de persistência

Toda ficha salva guarda `id`, não nome. Mudar um `id` quebra toda ficha já
criada. É por isso que a Classe **Perito** do Ressonância ainda tem
`id: "andarilho"`.

## O arquivo que você mexe: `js/config.js`

```js
segredos: false   // os sustos da Câmara dependem da pasta assets/
temaPadrao: "cartoon"
imagens: []       // os caminhos de img/ que JÁ existem
```

**`imagens: []`** é o que deixa o console limpo sem as artes: o site só pede
o que está declarado ali, e o resto vira painel com a cor do sistema. Largou
a arte em `img/`? Acrescente o caminho. Nomes e tamanhos em `img/LEIAME.txt`.

## Os dois temas

**Cartoon** (borda 3px, sombra dura, as 7 peles) e **Dark Fantasy** (fundo
quase preto, borda 1px, magenta de acento). Na primeira visita o site
pergunta, com prévia real de cada um; depois troca pelo seletor no topo.
A troca **não recarrega nada** — dá pra trocar no meio da criação de ficha.

## O retrato

Escolhe do aparelho, é cortado em quadrado, reduzido pra 512px e guardado
como data URL dentro da ficha — então **vai junto no JSON exportado**, sem
imgur e sem link que morre. A redução não é capricho: o `localStorage` tem
cerca de 5MB no total, e uma foto de celular tem 3 a 8MB sozinha.

## Onde as fichas ficam

No navegador daquele aparelho. Trocou de celular, limpou os dados do site ou
abriu em aba anônima e não está lá. **Apagar não tem desfazer.** O botão
**JSON** de cada card é o backup, e o Importar aceita vários de uma vez.

## O que falta

- compêndio e montador do **Feiticeiros & Maldições** (livro de 370 páginas)
- a **ficha de jogo** do Saa (o montador existe; a tela de jogo, não)
- Aventuras, Homebrews e Galeria — as abas existem com estado vazio honesto
- **todas as artes**: nenhuma imagem foi criada ainda

## Publicar no GitHub Pages

1. **New repository** → `tabula-redonda` → Public → Create.
2. **Add file → Upload files**: os `.html`, e as pastas `css/`, `js/`, `img/`.
3. **Settings → Pages** → branch `main`, pasta `/ (root)` → Save.

Site estático não tem banco pra cair nem servidor pra dormir: o GitHub Pages
serve arquivo, e é por isso que ele não repete o problema da hospedagem
anterior.


---

## O que mudou nesta leva (23/10)

**O trilho passava por cima do criador, da estante e da ficha.**
A causa era especificidade de CSS, não layout: `body[data-casca] .tela`
vale (0,2,1) e `.tela.area-estreita` vale (0,2,0). O segundo perdia por um
ponto, a margem esquerda virava zero e as três telas de trabalho começavam
embaixo do trilho. Vir depois no arquivo não resolve — especificidade é
decidida antes da ordem. O seletor agora carrega `body[data-casca]` na
frente. Está no comentário em `css/casca.css`, junto da explicação.

**Sistemas e Compêndio não chutam mais Ressonância.**
Era isso que fazia o livro resgatado "não salvar": o resgate gravava
certo, mas o trilho levava sempre pro Ressonância, então o material do Saa
ou do Jujutsu nunca aparecia. Sem `?s=` na URL, as duas páginas perguntam
qual sistema. Com `?s=`, o trilho carrega o sistema pra frente.

**Criar personagem virou aba da estante.** `criar.html` e `criar-saa.html`
continuam existindo, mas não são destino solto do trilho — quem procura
"criar ficha" procura em Fichas. A estante tem três abas: Personagens,
Criar personagem (com a capa de cada sistema) e Importar e backup.

**Feiticeiros & Maldições está liberado** e entra como os outros: sem o
aviso de obra de terceiros na Loja, com o crédito do Projeto Onigiri no
cartão. O compêndio e o montador dele ainda não existem — é livro de 370+
páginas e vira uma leva própria.

**Arte.** Capas tiradas da página 1 dos próprios PDFs; cenas de fundo em
28% nos atalhos e 5% no papel de parede; personagens recortados por cima,
no atalho e no banner do sistema. O que é provisório e o que falta você
mandar está listado em `img/LEIAME.txt`.

**Celular.** A caixa das 7 bolinhas de pele estourava 390px e fazia o
painel rolar de lado; ela some no estreito. O banner sangrava 20px de cada
lado com um miolo de 14px — agora o sangramento casa com o padding.

---

## Segunda leva do dia 23

**O carrossel abre no segundo cartaz.** O destaque do Ressonância ficou na
posição 2 de propósito: assim já tem um cartaz de cada lado e as duas setas
funcionam desde o primeiro segundo. Quem manda é `ANUNCIO_INICIAL`, em
`js/sistemas.js` — a tela só obedece.

**O Compêndio saiu do trilho e virou aba do sistema.** Ele é leitura de
consulta, não porta de entrada: quem procura o compêndio do Jujutsu procura
dentro do Jujutsu. O trilho ficou com quatro destinos: Início, Sistemas,
Fichas e personagens, Loja.

**A página do sistema deixou de ser um beco.** Agora tem uma barra logo
abaixo do banner com as quatro coisas que se quer fazer ali: voltar para os
sistemas, criar personagem, ver as fichas e abrir o PDF. Os materiais viraram
cartões largos com capa, número de páginas e o que dá pra fazer com cada um.

**PDF de verdade.** `livros/` guarda os arquivos e `config.livros` diz quais
existem. O que não existe mostra onde largar, em vez de abrir aba em branco.
Os dois livros do F&M precisam ser copiados à mão — veja `livros/LEIAME.txt`.

**O Cartoon saiu do site.** Painel, sistemas, loja, estante e montadores são
Dark Fantasy e ponto. O Cartoon sobrou onde foi desenhado: a ficha de jogo,
a tela de usar a ficha e girar dado. Quem decide é `<html data-temavel>` —
tem que ser no `<html>` e não no `<body>`, porque o `tema.js` roda dentro do
`<head>`, quando o `<body>` ainda não existe.

**Feiticeiros & Maldições inteiro.** `js/fm.js` carrega as regras lidas do
Livro v2.5.2 e conferidas contra o Modelo de Ficha v2.5 em Excel — que é a
fonte das fórmulas. A prova é o Nanami nível 1 do próprio livro: 15 PV, 4 PE,
maestria +2. Daí saem 108 entradas de compêndio e um montador de 7 etapas
(`criar-fm.html`), com compra por pontos, as 7 Origens, as 6 Especializações,
as 20 perícias, os 5 testes de resistência e a técnica com feitiços.

**Três coisas que eram min-width:auto.** A coluna do compêndio, os cartões de
entrada e as etiquetas esticavam a página pra 675px num celular de 390 —
item de grid não encolhe abaixo do conteúdo a menos que você mande. Está
comentado em `css/paginas.css`, nos três lugares.


---

## Ajuste final antes de publicar

- O carrossel abre no **Bestiário**, que continua sendo o segundo cartaz —
  a posição é o que garante seta dos dois lados; qual arte fica lá é só
  trocar a ordem em `ANUNCIOS`.
- A barra do sistema ficou só com o **← Voltar para sistemas**. Criar
  personagem, Minhas fichas e Ler o PDF já existem na aba Personagens e no
  cartão do livro — três botões pra mesma coisa é ruído.
- A **aba Compêndio saiu**. O "Abrir compêndio" vive no cartão do livro,
  que é onde ele faz sentido: um compêndio é de um livro, não do sistema.
- **Manual do Mestre** saiu da biblioteca.
- Os quatro PDFs estão em `livros/` e listados em `config.livros`. Os do
  Jujutsu ficaram com o nome original — o site codifica espaço, acento e
  "&" na hora de montar o link, então não precisa renomear nada.
- **Campo solto dentro de cartão** (as Anotações, os feitiços, a técnica)
  não tinha estilo: caía no padrão do navegador — fundo claro, borda branca
  e fonte de máquina de escrever no meio de uma página escura. Agora segue
  a mesma régua dos campos de `.campo`.
- A **Revisão passou a listar o que falta**. Antes ela só checava
  contradição, então uma ficha vazia chegava lá dizendo "ficha fechada".

---

## Correções de regra 23/10 (noite)

**Os orçamentos estavam travados no Nível 1.** O livro, p.15: *"Nível 1:
34 pontos de atributo · 2 Pontos de Perícia da Origem + os da Classe · 3
Pontos de Concepção. Nível 2 a 20: +2 pontos de atributo · +1 Ponto de
Perícia · +1 Ponto de Concepção, a cada nível."* A Concepção já subia; os
outros dois não — uma ficha de Nível 5 mostrava 34 pontos como se fosse
recém-criada. Agora `pontosDeAtributo(nível)` e `pontosDePericia(nível,
classe)` moram no `regras.js`, e criador e estante leem os dois de lá.

**O bônus da Origem não estava sumido — estava invisível.** Ele sempre
funcionou, mas vivia no fim da etapa Origem e não aparecia em painel
nenhum, então na etapa Atributos o número 34 parecia ignorar a Origem.
Agora tem um medidor próprio ("Bônus da Origem X / Y") e a etapa Atributos
avisa quando ainda tem ponto de Origem pra colocar. A ordem continua a do
livro: distribuir os pontos primeiro, aplicar os bônus por cima.

**O tema não trocava na ficha — e a causa era colisão de nome.** A câmara
(`nucleo.js`) também define `R.Tema`, mas o Tema dela é a PELE. Na
`ficha.html` os dois carregam e a câmara roda depois, então
`window.RSS.Tema.botao()` apontava pro objeto errado e explodia. O módulo
de tema do site agora mora também em `window.TabulaTema`, que é só dele, e
todas as telas leem de lá.

**Descanso longo saiu do fundo da aba Itens** e foi pra junto das barras
que ele enche. No celular estava duas rolagens abaixo de onde se procura.

**Bônus do Mestre.** Dois ± ao lado do Descanso ajustam o MÁXIMO de Vida e
de Reserva. Nenhuma fórmula do livro produz "+5 de Vida nessa missão", mas
a mesa produz. Fica gravado na ficha, viaja no JSON e sobrevive a fechar o
navegador.

**A ficha de jogo abre mesmo incompleta.** Antes, ficha sem fechar só
oferecia "Continuar", que leva ao criador — daí a impressão de que a ficha
de jogo não existia. Agora tem também "Abrir assim mesmo".
