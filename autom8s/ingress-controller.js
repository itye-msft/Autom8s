const express = require('express');
const IngressManager = require('./ingress-manager');

const router = express.Router();

/**
 * Sets an inbound rule in the ingress controller, to expose a service endpoint
 */
router.post('/setrule',
  async (req, res) => {
    // init params
    const {
      serviceName,
      servicePort,
      specificlb,
      specificport,
      specificrelease,
    } = req.body;

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
