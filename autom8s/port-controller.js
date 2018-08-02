const express = require('express');
const PortsAllocator = require('./ports-allocator');

const router = express.Router();

/**
 * Get a single unused port in the ingress controller
 */
router.get('/getPort',
  async (req, res, next) => {
    const portService = new PortsAllocator();
    const { lbip } = req.body;

    await portService.getPort(lbip)
      .then((data) => {
        res.send(data);
      })
      .catch(next);
  });

module.exports = router;
