const express = require('express');
const PortService = require('./port-service');

const router = express.Router();

router.get('/getPort',
  async (req, res, next) => {
    const portService = new PortService();
    const { lbip } = req.body;

    await portService.getPort(lbip)
      .then((data) => {
        res.send(data);
      })
      .catch(next);
  });

router.get('/getExistingPorts',
  async (req, res, next) => {
    const portService = new PortService();

    await portService.getExistingPorts()
      .then((data) => {
        res.send(data);
      })
      .catch(next);
  });

module.exports = router;
