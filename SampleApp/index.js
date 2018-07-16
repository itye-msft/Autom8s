var express = require('express');
const util = require('util');
var request = require('request');
const requestPostAsync = util.promisify(request.post);
const requestGetAsync = util.promisify(request.get);

var router = express.Router();
var autom8sUrl = "localhost";
const Paths = {
    HelmInstall: 'http://' + autom8sUrl + ':4000/install',
    SetIngressRule: 'http://' + autom8sUrl + ':4000/setrule'
}

router.get('/test',
    async (req, res) => {
        let chart = { name: "stable/rabbitmq", servicePort: 5672 };
        var installChartResult = await InstallChart(chart);
        res.send(installChartResult);
    });



async function InstallChart(chart) {
    try {
        // perform helm install
        var installResponse = await requestPostAsync(Paths.HelmInstall, { form: { chartName: chart.name } });
        installResponse = JSON.parse(installResponse);

        // create a rule to expose the new service expternally
        var ingressResponse = await requestGetAsync(Paths.SetIngressRule, { serviceName: installResponse.serviceName, servicePort: chart.servicePort });
        ingressResponse = JSON.parse(ingressResponse);

        if (ingressResponse.information == "success") {
            return "Your new service: " + ingressResponse.releaseName + ", is publicly accessibly on " + ingressResponse.ip + ":" + ingressResponse.port;
        }
        else {
            return "failed";
        }
    }
    catch (error) {
        console.log(error);
        return "failed";
    }
}

module.exports = router;