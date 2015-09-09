var fs = require('fs');
var url = require('url');

var headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10, // Seconds.
  'Content-Type': "application/json"
};

var sendResponse = function(statusCode, response, responseEnd, contentType) {
  headers['Content-Type'] = contentType;
  response.writeHead(statusCode, headers);
  if (contentType === 'application/json') {
    responseEnd = JSON.stringify(responseEnd);
  }
  response.end(responseEnd);
};

var handleFileRequest = function(statusCode, response, url) {
  fs.readFile('../client' + url, 'utf8', function(err, data) {
    if (err) {
      throw err;
    }
    else if (data) {
      sendResponse(statusCode, response, data, '');
    }
  });
};

var requestHandler = function(request, response) {

  console.log("Serving request type " + request.method + " for url " + request.url);
  var statusCode = 200;
  var data = '';
  var responseEnd = {};
  var parsedURL = url.parse(request.url);
  var path = parsedURL.pathname;

  if (path.slice(0, 9) === '/classes/') {     
    if (request.method === 'POST') {
      statusCode = 201;      
      request.on('data', function(chunk) {
        data += chunk;
      });
      request.on('end', function() {
        var parsedData = JSON.parse(data);
        messages.push(parsedData);
        sendResponse(statusCode, response, parsedData, 'application/json');
        fs.appendFile('./messages.json', data + '\n', function(err) {
          if (err) {
            console.log('error: ' + err);
            throw err;
          }
        });
      });
    }

    if (request.method === 'GET') {
      var messageArr = [];
      fs.readFile('./messages.json', 'utf8', function(err, data) {
        if (err) {
          console.log('error: ' + err);
          fs.closeSync(fs.openSync('./messages.json', 'w'));
          throw err;
        }
        else if (data) {
          messageArr = data.split('\n');
          messageArr = messageArr.slice(0, messageArr.length - 1);
          messages = messageArr.reverse().map(function(m) {
            return JSON.parse(m);
          });
        }          
      });
      sendResponse(statusCode, response, {results: messages}, 'application/json');
    }

    if (request.method === 'OPTIONS') {
      sendResponse(statusCode, response, 'permission granted', '');
    }
  } else if (path === '/') {
    fs.readFile('../client/index.html', 'utf8', function(err, data) {
      if (err) {
        console.log('Error: ', err);
        throw err;
      } else if (data) {
        sendResponse(statusCode, response, data, 'text/html');
      }
    });
  } else if (path in validPaths) {
    handleFileRequest(statusCode, response, path);
  } else {
    statusCode = 404;
    sendResponse(statusCode, response, 'Nothing found', 'text/plain');
  }
};

var validPaths = {
  '/styles/styles.css' : true,
  '/bower_components/jquery/jquery.min.js'  : true,
  '/bower_components/underscore/underscore-min.js' : true,
  '/env/config.js' : true,
  '/scripts/app.js' : true,
  '/images/spiffygif_46x46.gif' : true,
  '/bower_components/underscore/underscore-min.map' : true
};

var messages = [];

module.exports = {
  requestHandler: requestHandler
};

