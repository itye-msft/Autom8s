'use strict';
const HelmWrapper = require("./helm-wrapper");
var express = require('express');
var router = express.Router();

// Installs the requested chart
router.post('/install',
    async (req, res) => {
        const deployOptions = req.body;

        let helmWrapper = new HelmWrapper();
        await helmWrapper.install(deployOptions)
            .then((installResponse) => {
                res.send({
                    status: "success",
                    serviceName: installResponse.serviceName,
                    releaseName: installResponse.releaseName
                });
            }).catch((err) => {
                res.statusCode = 500;
                res.send({
                    status: "failed",
                    reason: err.toString()
                });
            })
    });

router.post('/delete',
    async (req, res) => {
        const delOptions = req.body;
        let helmWrapper = new HelmWrapper();
        await helmWrapper.delete(delOptions)
            .then(() => {
                res.send({
                    status: "success"
                });
            }).catch((err) => {
                res.statusCode = 500;
                res.send({
                    status: "failed",
                    reason: err.toString()
                });
            })
    });


router.post('/upgrade',
    async (req, res) => {
        let result = {};
        const deployOptions = req.body;
        let helmWrapper = new HelmWrapper();
        await helmWrapper.upgrade(deployOptions)
            .then(() => {
                res.send({
                    status: "success"
                });
            }).catch((err) => {
                res.statusCode = 500;
                res.send({
                    status: "failed",
                    reason: err.toString()
                });
            })
    });

module.exports = router;