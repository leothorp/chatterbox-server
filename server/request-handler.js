var fs = require('fs');

var headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10, // Seconds.
  'Content-Type': "application/json"
};

var sendResponse = function(statusCode, response, responseEnd) {
  response.writeHead(statusCode, headers);
  response.end(JSON.stringify(responseEnd));
}

var requestHandler = function(request, response) {

  console.log("Serving request type " + request.method + " for url " + request.url);

  var statusCode = 200;
  
  var data = '';
  var responseEnd = {};

  if (request.url.slice(0, 9) === '/classes/') {     
    
    if (request.method === 'POST') {
      statusCode = 201;      
      request.on('data', function(chunk) {
        data += chunk;
      });
      request.on('end', function() {
        var parsedData = JSON.parse(data);
        messages.push(parsedData);
        sendResponse(statusCode, response, parsedData);
        // append new message to messages.json file
        fs.appendFile('./messages.json', data + '\n', function(err) {
          if (err) {
            console.log('error: ' + err);
            throw err;
          }
          console.log('success!');  
        });

      });
    }

    if (request.method === 'GET') {
      var messageArr = [];
      fs.readFile('./messages.json', 'utf8', function(err, data) {
        if (err) {
          console.log('error: ' + err);
          fs.closeSync(fs.openSync('./messages.json', 'w'));
          //throw err;
        }
        else if (data) {
          messageArr = data.split('\n');
          messageArr = messageArr.slice(0, messageArr.length - 1);
          console.log(messageArr);
          messages = messageArr.map(function(m) {
            return JSON.parse(m);
          });
          sendResponse(statusCode, response, {results: messages});
        }
      });
    }

    if (request.method === 'OPTIONS') {
      sendResponse(statusCode, response, 'permission granted');
    }
  }
  else {
    statusCode = 404;
    sendResponse(statusCode, response, 'Nothing found');
  }

  
};




var messages = [];

module.exports = {
  requestHandler: requestHandler
};

