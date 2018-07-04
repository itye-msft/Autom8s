var express = require('express')
var request = require('request');


//gather settings to operate
const settings = {
    PortServiceServicePort: process.env.PortServiceServicePort || 4001,
    PortServiceServicePort: process.env.PortServiceServicePort || 4002,
    PortServiceServicePort: process.env.PortServiceServicePort || 4003,
    ServingPort: process.env.AppServingPort || 4009
}

const Paths = {
    GetPort:'http://localhost:4001/getport',
    HelmInstall:'http://localhost:4002/install',
    HelmDelete:'http://localhost:4002/delete',
    SetIngressRule:'http://localhost:4003/setrule'
}

//start serving requests
var app = express()
app.listen(settings.ServingPort, function () {
    console.log('Listening on port ' + settings.ServingPort);
})


app.get('/', function (req, res) {
    res.send('Service is running');
});

app.get('/test', (req, res, next) => {
    request(Paths.GetPort , function (error, response, body) {
        res.send(body);
    });
})

function InstallChart(chartName){
    request.post(Paths.HelmInstall,{chartName:"stable/grafana", releaseName:"my-release"},function(error, response, body){
        let install = body;
        if(install.information && install.information=="success"){
            request(Paths.GetPort , function (error, response, body) {
                var ipport = body;
                request(Path.SetIngressRule,{servicename:install.serviceName, serviceport:80},function (error, response, body) {

                })
            });
        }
    });
}