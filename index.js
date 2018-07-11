'use strict';
var express = require('express');
var helmServer = require('./k8s-helm-http-wrapper/helm-server');
var portServer = require('./k8s-port-service/port-server');
var ingressServer = require('./k8s-ingress-manager/ingress-server');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', helmServer);
app.use('/', portServer);
app.use('/', ingressServer);

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
