const express = require('express');
const bodyParser = require('body-parser');
const helmRouter = require('./autom8s/helm-controller');
const portRouter = require('./autom8s/port-controller');
const ingressServer = require('./autom8s/ingress-controller');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', helmRouter);
app.use('/', portRouter);
app.use('/', ingressServer);

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
