const fs = require('fs');
const $path = require('path');
const express = require('express');

const app = express();
const port = process.env.PORT || 5000;
const publicDir = $path.resolve('./public');
const articlesDir = $path.resolve('./articles');

app.use(express.static('public'));
app.listen(port, () => console.log(`Blog app listening on port ${port}!`));

app.get('/articles.json', (request, response) => {
    let articles = allArticles();
    let data = JSON.stringify(articles);
    response.type('text/json');
    response.send(data);
});
app.get('/articles', (request, response) => {
    response.sendFile($path.join(publicDir, 'articles.html'))
});

app.get('/articles/:articleId.json', (request, response) => {
    let filePath = articleFilePath(request.params.articleId);
    response.sendFile(filePath);
});

app.get('/articles/:articleId', (request, response) => {
    let filePath = articleFilePath(request.params.articleId);
    if (fs.existsSync(filePath)) {
        let htmlFile = $path.join(publicDir, "article.html");
        response.sendFile(htmlFile);
    }
    else {
        response.status(404).send(`Article ${request.params.articleId} not found`);
    }
});

app.get('/publish', (request, response) => {
    let htmlFile = $path.join(publicDir, "publish.html");
    response.sendFile(htmlFile);
  })

  app.post('/articles', express.urlencoded({extended: false}), (request, response) => {
    createArticle(nextArticleId(), request.body, response)
  })

function articleFilePath(articleId) {
    return $path.join(articlesDir, articleId + ".json");
}

function allArticles() {
    return fs.readdirSync(articlesDir)
        .filter(file => file.endsWith('.json'))
        .map(file => JSON.parse(fs.readFileSync($path.join(articlesDir, file))))
        .sort((a, b) => (a.id - b.id));
}

function createArticle(articleId, params, response) {
    let article = {
      id: articleId,
      author: params.author.trim(),
      title: params.title.trim(),
      body: params.body.trim()
    };
  
    let articleDataFile = $path.join(articlesDir, articleId + ".json");
    fs.writeFile(articleDataFile, JSON.stringify(article), (err) => {
      if (err) {
        response.status(500).send(err);
      } else {
        response.redirect('/articles');
      }
    });
  }

  // Pick an unused article id.
function nextArticleId() {
    let articles = allArticles();
  
    // find the highest id...
    let id = articles[articles.length - 1].id;
  
    // ...and pick a higher one
    let articleId = id + 1;
    return articleId;
  }

app.get('/search', (request, response) => {
    response.sendFile($path.join(publicDir, 'search.html'))
})

app.get('/search.json', (request, response) => {
    let results = searchArticles(request.query)
    response.type('text/json');
    response.send(JSON.stringify(results));
});

function searchArticles(params) {
    let results = allArticles().filter((article)=>{
        if(params.author) {
            let articleAuthor = article.author || '';
            let targetAuthor = params.author || '';
            return articleAuthor.toLowerCase().includes(targetAuthor.toLowerCase());
        }
    });
    return results;
}