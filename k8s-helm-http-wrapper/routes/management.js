'use strict';
const util = require('util');
const exec = util.promisify(require('child_process').exec);
var express = require('express');

const helmBinaryLocation = '/usr/local/bin/helm';

var router = express.Router();

exec(helmBinaryLocation + ' init');

async function executeHelm(command, values = '') {
    const { stdout, stderr } = await exec(helmBinaryLocation + ' ' + command + values);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
}

function getConfigValues(deployObject) {
    if (!deployObject) {
        return "";
    }

    let configStr = '';
    for (let attribute in deployObject) {
        if (deployObject.hasOwnProperty(attribute)) {
            configStr += ' --set ' + attribute + '=' + deployObject[attribute]
        }
    }
    return configStr;
}

async function innerInstallUpgrade(command, deployOptions) {

    let chartName = deployOptions.chartName.toLowerCase();
        let releaseName = deployOptions.releaseName.toLowerCase();
        let serviceName = `${releaseName}-${chartName}`.toLowerCase();
        
    if (deployOptions.privateChartsRepo) {
        var tokens = chartName.split("/");
        // adds the private repo to helm known repos
        await executeHelm("repo add " + tokens[0] + " " + deployOptions.privateChartsRepo);
        // fetch the data from all known repos
        await executeHelm("repo update");
    }

    // install the chart from one of the known repos
    await executeHelm(command,
        getConfigValues(deployOptions.values))
        /*.then(() => {
            res.send({
                information: "success",
                serviceName: serviceName,
                releaseName: releaseName,
                chartName: chartName
            });
        }).catch((err) => {
            res.statusCode = 500;
            res.send({
                information: "failed",
                serviceName: serviceName,
                releaseName: releaseName,
                chartName: chartName,
                reason: err
            });*/
        //})
}
// Installs the asked chart
router.post('/install',
    async (req, res) => {
        let result = {};
        const deployOptions = req.body;
        let chartName = deployOptions.chartName.toLowerCase();
        let releaseName = deployOptions.releaseName.toLowerCase();
        let serviceName = `${releaseName}-${chartName}`.toLowerCase();

        let installCommand = 'install ' + chartName + ' --name ' + releaseName;
        await innerInstallUpgrade(installCommand, deployOptions)
        .then(() => {
            res.send({
                information: "success",
                serviceName: serviceName,
                releaseName: releaseName,
                chartName: chartName
            });
        }).catch((err) => {
            res.statusCode = 500;
            res.send({
                information: "failed",
                serviceName: serviceName,
                releaseName: releaseName,
                chartName: chartName,
                reason: err
            });
        })
    });

router.post('/delete',
    async (req, res) => {
        const delOptions = req.body;

        let releaseName = delOptions.releaseName;

        await executeHelm('delete ' + releaseName)
            .then(() => {
                res.send({
                    information: "success",
                    releaseName: releaseName,
                });
            }).catch((err) => {
                res.statusCode = 500;
                res.send({
                    information: "failed",
                    releaseName: releaseName,
                    reason: err
                });
            })

    });


router.post('/upgrade',
    async (req, res) => {
        let result = {};
        const deployOptions = req.body;
        let chartName = deployOptions.chartName.toLowerCase();
        let releaseName = deployOptions.releaseName.toLowerCase();
        let serviceName = `${releaseName}-${chartName}`.toLowerCase();

        let upgradeCommand = 'upgrade ' + releaseName + ' ' + chartName;

        await innerInstallUpgrade(upgradeCommand, deployOptions)
        .then(() => {
            res.send({
                information: "success",
                serviceName: serviceName,
                releaseName: releaseName,
                chartName: chartName
            });
        }).catch((err) => {
            res.statusCode = 500;
            res.send({
                information: "failed",
                serviceName: serviceName,
                releaseName: releaseName,
                chartName: chartName,
                reason: err
            });
        })
    });

module.exports = router;