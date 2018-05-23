var express = require('express')
var request = require('request');


//gather settings to operate
const settings = {
    PortServiceServicePort: process.env.PortServiceServicePort || 4001,
    ServingPort: process.env.AppServingPort || 4009
}

const Paths = {
    GetPort:'http://localhost:' +settings.PortServiceServicePort + '/getport'
}

//start serving requests
var app = express()
app.listen(settings.ServingPort, function () {
    console.log('Listening on port ' + settings.ServingPort);
})


app.get('/', function (req, res) {
    res.send('Service is running');
});

app.get('/test', (req, res, next) => {
    request(Paths.GetPort , function (error, response, body) {
        res.send(body);
    });
})
