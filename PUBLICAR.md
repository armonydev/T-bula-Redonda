# Publicar o Tábula Redonda no GitHub Pages

## O limite de 25 MB não é o limite do Git

É o limite de **arrastar arquivo no site do github.com**. Pelo Git, os
números são outros:

| Como | Limite |
|---|---|
| Arrastar no navegador | 25 MiB — e é esse que te barrou |
| `git push` | avisa acima de 50 MiB, **mas sobe** |
| `git push` | bloqueia acima de 100 MiB |
| Site publicado no Pages | 1 GB |

Os seus dois maiores têm 55 MB e 43 MB. Os dois passam. O de 55 MB vai
soltar um aviso amarelo e subir assim mesmo. A pasta inteira dá uns
110 MB — longe do 1 GB.

**Então a resposta é: não use o navegador. Use o Git.**

## Os comandos

No PowerShell, dentro da pasta `site`:

```
cd "C:\Users\Kain\Desktop\minhas coisas\sistema rpg\sistema v2\site"
git init
git add .
git commit -m "Tabula Redonda"
git branch -M main
git remote add origin https://github.com/kaina-hofman/tabula-redonda.git
git push -u origin main
```

Crie o repositório vazio no GitHub antes (**sem** README, sem .gitignore —
o `.gitignore` já está aqui). Se preferir clicar em vez de digitar, o
**GitHub Desktop** faz os mesmos passos e também não tem o limite de 25 MB.

Depois: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
O endereço sai em `https://kaina-hofman.github.io/tabula-redonda/`.

## Git LFS não serve aqui

Parece a solução óbvia pra arquivo grande, mas o GitHub Pages **não
resolve arquivo de LFS** — ele serve o ponteiro, um arquivo de texto de
três linhas, e o PDF abre quebrado. Fora que a cota de LFS do plano
gratuito é 1 GB de banda por mês, que alguns downloads do livro já comem.
Como os seus arquivos passam no Git normal, não há motivo pra LFS.

## Se um dia quiser tirar os livros dos outros do repositório

O site já aceita apontar pro lugar oficial em vez de hospedar:

1. tire a linha do arquivo da lista `livros` em `js/config.js`;
2. no `js/sistemas.js`, no material, ponha `pdfUrl:"https://link-deles"`.

O botão vira **"Baixar no site oficial ↗"** e nada fica no seu repo. Tem um
comentário com isso escrito no próprio `sistemas.js`, no livro do Jujutsu.

## O que nunca sobe

A pasta `assets/` — ela tem personagem de terceiros dentro. Já está no
`.gitignore`, então o `git add .` ignora sozinho. Não tire de lá.
