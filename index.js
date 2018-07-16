'use strict';
var express = require('express');
var helmServer = require('./autom8s/helm-server');
var portServer = require('./autom8s/port-server');
var ingressServer = require('./autom8s/ingress-server');
var sampleApp = require("./SampleApp/index");
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', helmServer);
app.use('/', portServer);
app.use('/', ingressServer);
app.use("/", sampleApp);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.set('port', process.env.PORT || 4000);

var server = app.listen(app.get('port'), function () {
    console.log('Server listening on port ' + server.address().port);
});
