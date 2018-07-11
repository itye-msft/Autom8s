'use strict';
const IngressManager = require("./ingress-manager");
var express = require('express');

var router = express.Router();

router.get('/setrule',
    async (req, res) => {
        //init params
        let serviceName = req.query.serviceName;
        let servicePort = req.query.servicePort;
        let specificlb = req.query.specificlb;
        let specificport = req.query.specificport;
        let specificrelease = req.query.specificrelease;

        let ingressManager = new IngressManager();
        await ingressManager.setRule(serviceName, servicePort, specificport, specificlb, specificrelease)
            .then((response) => {
                res.send({
                    information: "success",
                    ip: response.ip,
                    port: response.port,
                    releaseName: response.releaseName
                });
            })
            .catch((err) => {
                res.statusCode = 500;
                res.send({
                    information: "failed",
                    reason: err.toString()
                });
            });
    });

module.exports = router;