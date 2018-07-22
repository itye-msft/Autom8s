const express = require('express');
const bodyParser = require('body-parser');
const helmServer = require('./autom8s/helm-server');
const portServer = require('./autom8s/port-server');
const ingressServer = require('./autom8s/ingress-server');
const sampleApp = require('./SampleApp/index');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', helmServer);
app.use('/', portServer);
app.use('/', ingressServer);
app.use('/', sampleApp);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.set('port', process.env.PORT || 4000);

const server = app.listen(app.get('port'), () => {
  console.log(`Server listening on port ${server.address().port}`);
});
