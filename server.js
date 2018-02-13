// server.js
// where your node app starts

// init project
var express = require('express');
var mongodb = require('mongodb');
var url = require('url');
var uri = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.PORT+'/'+process.env.DB;
var app = express();

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

function valid(str) {
  var regex = /https?:\/\/(?:www\.)?\w+\.com(?::\d+)?/g;
  return regex.test(str);
}

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));


// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/*', function(req, res) {
  var data = url.parse(req.url).pathname.substring(1);
  
  if (data.substring(0, 3) === 'new') {
    mongodb.MongoClient.connect(uri, function(err, client) {
      if (err) throw err;
      var db = client.db('url');
      var collection = db.collection('shorturl');
      var url = data.substring(4);
      if (valid(url)) {
        collection.find( { "url": url } ).toArray(function(err, results) {
          if (err) throw err;
          if (results.length !== 0) {
            var shorturl = results[0].shorturl;
            var obj = { "origial_url": url ,"short_url": "https://abounding-attempt.glitch.me/" + shorturl };
            res.end(JSON.stringify(obj));
          }else {
            collection.find().sort( { shorturl:-1 } ).limit(1).toArray(function(err, results) {
              var shorturl = Number(results[0].shorturl) + 1;
              var obj = { "origial_url": url ,"short_url": "https://abounding-attempt.glitch.me/" + shorturl };
              collection.insert( { "url": url ,"shorturl": shorturl }, function(err,results){
                res.end(JSON.stringify(obj));
              });
            });
          }
        });
      }else {
        res.end('enter a valid URL');
      }
    });
  }else if (/\d+/.test(data)){
    mongodb.MongoClient.connect(uri, function(err, client) {
      if (err) throw err;
      var db = client.db('url');
      var collection = db.collection('shorturl');
      var shorturl = Number(data);
      collection.find( { "shorturl": shorturl } ).toArray(function(err, results){
        res.redirect(results[0].url);
        client.close();
      });
    });
   }
});

// listen for requests :)
var listener = app.listen(3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
