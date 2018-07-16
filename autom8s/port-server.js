"use strict";
var PortService = require('./port-service');
var express = require('express');
var router = express.Router();

router.get('/getPort',
    async (req, res, next) => {
        let portService = new PortService();
        let lbip = req.body.lbip;

        await portService.getPort(lbip)
            .then((data) => {
                res.send(data);
            })
            .catch(next);
    });

router.get('/getExistingPorts',
    async (req, res, next) => {
        let portService = new PortService();

        await portService.getExistingPorts()
            .then((data) => {
                res.send(data);
            })
            .catch(next);
    });

module.exports = router;