'use strict';
const IngressManager = require('./ingress-manager');
var express = require('express');

var router = express.Router();

router.post('/setrule',
    async (req, res) => {
        //init params
        let serviceName = req.body.serviceName;
        let servicePort = req.body.servicePort;
        let specificlb = req.body.specificlb;
        let specificport = req.body.specificport;
        let specificrelease = req.body.specificrelease;

        let ingressManager = new IngressManager();
        await ingressManager.setRule(serviceName, servicePort, specificport, specificlb, specificrelease)
            .then((response) => {
                res.send({
                    status: 'success',
                    ip: response.ip,
                    port: response.port,
                    releaseName: response.releaseName
                });
            })
            .catch((err) => {
                res.statusCode = 500;
                res.send({
                    status: 'failed',
                    reason: err.toString()
                });
            });
    });

module.exports = router;