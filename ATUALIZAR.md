# Atualizar o site no GitHub

Pasta: `C:\Users\Kain\Desktop\minhas coisas\sistema rpg\sistema v2\site`
Repositório: `https://github.com/armonydev/T-bula-Redonda`

## Os comandos, em ordem

```powershell
cd "C:\Users\Kain\Desktop\minhas coisas\sistema rpg\sistema v2\site"

# 1. apaga a página morta do build antigo
#    sistemas.html era o nome antigo do painel, antes de virar index.html.
#    Não quebra nada, mas é uma página velha acessível no site publicado.
Remove-Item sistemas.html -ErrorAction SilentlyContinue

# 2. garante que o origin aponta pro repositório certo
git remote set-url origin https://github.com/armonydev/T-bula-Redonda.git

# 3. manda tudo. O -A pega também o arquivo apagado no passo 1.
git add -A
git commit -m "Livros, Feiticeiros e Maldicoes completo e correcoes de regra"
git branch -M main
git push -u origin main --force
```

## O que esperar

- **O push demora.** A pasta `livros/` tem 108 MB em quatro PDFs.
- **O Git vai avisar** que o arquivo de 55 MB passa de 50 MB. É só aviso:
  ele sobe. O bloqueio de verdade é 100 MB, e o limite de 25 MB é só o de
  arrastar arquivo no navegador.
- **`--force` é seguro aqui.** O que está no GitHub hoje é o seu próprio
  upload pelo navegador, de uma cópia mais velha dos mesmos arquivos. A
  versão completa é a do PC.
- Se o `git remote set-url` reclamar que não existe origin, troque aquela
  linha por:
  `git remote add origin https://github.com/armonydev/T-bula-Redonda.git`

## Se pedir usuário e senha

O GitHub não aceita mais a senha da conta no terminal. Duas saídas:

1. **GitHub Desktop** — File › Add local repository › aponta pra pasta
   `site`, escreve a mensagem, Commit to main, Push origin. Faz os mesmos
   passos sem terminal.
2. **Token** — github.com › Settings › Developer settings › Personal
   access tokens › Tokens (classic) › Generate new token, marca `repo`.
   No terminal, usuário = `armonydev`, senha = o token.

## Depois do push

1. **O repositório precisa ser público.** No plano gratuito o GitHub Pages
   não publica repositório privado. Settings › lá embaixo em Danger Zone ›
   Change visibility › Public.
2. Settings › Pages › Source: *Deploy from a branch* › **main** / **(root)**.
3. Espera uns dois minutos e abre
   `https://armonydev.github.io/T-bula-Redonda/`
4. Testa: os quatro PDFs abrem? O criador de ficha abre no celular?

## Conferir antes de mandar pros players

- `index.html` abre no painel, não na estante
- Sistemas › um sistema › **← Voltar para sistemas** funciona
- O cartão do livro tem **Ler o PDF** e **Abrir compêndio**
- Fichas › Importar e backup › os dois JSONs entram sem erro
