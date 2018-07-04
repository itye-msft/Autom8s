'use strict';
const util = require('util');
const exec = util.promisify(require('child_process').exec);
var express = require('express');

const helmBinaryLocation = process.env.HELM_BINARY;

var router = express.Router();

exec(helmBinaryLocation + ' init');

async function executeHelm(command, values = '') {
    const { stdout, stderr } = await exec(helmBinaryLocation + ' ' + command + values);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
    return stdout;
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
        
    if (deployOptions.privateChartsRepo) {
        var tokens = chartName.split("/");
        // adds the private repo to helm known repos
        await executeHelm("repo add " + tokens[0] + " " + deployOptions.privateChartsRepo);
        // fetch the data from all known repos
        await executeHelm("repo update");
    }

    if(deployOptions.reuseValue != undefined && ConvertToBool(deployOptions.reuseValue)){
        command = command + " --reuse-values ";
    }

    // install the chart from one of the known repos
    return await executeHelm(command, getConfigValues(deployOptions.values));
}
function findFirstService(json){
    let name = null;
    json.resources.forEach(element => {
        if (element.name == "v1/Service"){
            name = element.resources[0];
        }
    });
    return name;
}
// Installs the asked chart
router.post('/install',
    async (req, res) => {
        const deployOptions = req.body;
        let chartName = deployOptions.chartName.toLowerCase();
        let releaseName = deployOptions.releaseName;

        let installCommand = 'json install ' + chartName;
        if(releaseName!= undefined && releaseName!= null && releaseName != ""){
            installCommand = installCommand + ' --name ' + releaseName.toLowerCase();
        }
        await innerInstallUpgrade(installCommand, deployOptions)
        .then((output) => {
            let json = JSON.parse(output);
            res.send({
                information: "success",
                serviceName: findFirstService(json),
                releaseName: json.releaseName,
                chartName: chartName
            });
        }).catch((err) => {
            res.statusCode = 500;
            res.send({
                information: "failed",
                serviceName: "",
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
function ConvertToBool(obj)
{
    if(obj == null){
        return false;
    }
    // will match one and only one of the string 'true','1', or 'on' rerardless
    // of capitalization and regardless off surrounding white-space.
    //
    let regex=/^\s*(true|1|on)\s*$/i

    return regex.test(obj.toString());
}
module.exports = router;