const express = require('express');
const IngressManager = require('./ingress-manager');

const router = express.Router();

router.get('/setrule',
  async (req, res) => {
    // init params
    const { serviceName } = req.query;
    const { servicePort } = req.query;
    const { specificlb } = req.query;
    const { specificport } = req.query;
    const { specificrelease } = req.query;

    const ingressManager = new IngressManager();
    await ingressManager.setRule(
      serviceName, servicePort, specificport, specificlb, specificrelease,
    )
      .then((response) => {
        res.send({
          status: 'success',
          ip: response.ip,
          port: response.port,
          releaseName: response.releaseName,
        });
      })
      .catch((err) => {
        res.statusCode = 500;
        res.send({
          status: 'failed',
          reason: err.toString(),
        });
      });
  });

module.exports = router;
