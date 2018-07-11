var express = require('express')
var request = require('request');

var router = express.Router();

router.get('/test',
    async (req, res) => {
        let chart ={ name: "stable/rabbitmq", internalPort: 5672};
        InstallChart(chart, function(response){
            res.send(response);
        });
    });

const Paths = {
    GetPort:'http://localhost:4000/getport',
    HelmInstall:'http://localhost:4000/install',
    HelmDelete:'http://localhost:4000/delete',
    SetIngressRule:'http://localhost:4000/setrule'
}

function InstallChart(chart, callback){
    request.post(Paths.HelmInstall,{form:{chartName:chart.name}},function(error, response, installResponse){
        installResponse = JSON.parse(installResponse);
        if(installResponse.information && installResponse.information=="success"){
            request(Paths.GetPort , function (error, response, portResponse) {
                request(Paths.SetIngressRule,{serviceName:installResponse.serviceName, servicePort:chart.internalPort},function (error, response, ingressResponse) {
                    ingressResponse = JSON.parse(ingressResponse);
                    if(ingressResponse.information == "success"){
                        callback( "Your new service: "+ ingressResponse.releaseName + ", is publicly accessibly on " + ingressResponse.ip + ":" + ingressResponse.port);
                    }
                    else{
                        callback("failed");
                    }
                })
            });
        }
        else
            callback("failed");
    });
}

module.exports = router;