var express = require('express')
var request = require('request');


//gather settings to operate
const settings = {
    PortServiceServicePort: process.env.PortServiceServicePort || 4001,
    HelmServicePort: process.env.HelmServicePort || 4002,
    ServingPort: process.env.IngressServingPort || 4003
}

const Paths = {
    GetPort: 'http://localhost:' + settings.PortServiceServicePort + '/getport',
    HelmUpgrade: 'http://localhost:' + settings.HelmServicePort + '/upgrade'
}

//start serving requests
var app = express()
app.listen(settings.ServingPort, function () {
    console.log('Ingress Service is listening on port ' + settings.ServingPort);
})


app.get('/', function (req, res) {
    res.send('Ingress Service is running');
});

app.get('/setrule', (req, res, next) => {
    //init params
    let serivceName = req.query.servicename;
    let servicePort = req.query.serviceport;

    let port = ip = release = '';
    //if specific port/ip/release were requested:
    if (req.query.specificport != undefined && req.query.specificport != "" &&
        req.query.specificlb != undefined && req.query.specificlb != "" &&
        req.query.specificrelease != undefined && req.query.specificrelease != "") {
        ip = req.query.specificlb;
        port = req.query.specificport;
        release = req.query.specificrelease;
    }
    else {
        //get free port/ip/release
        request(Paths.GetPort, function (error, response, body) {
            ip = body.public_ip;
            port = body.port;
            release = body.release;
        });
    }

    //prepare data to post
    let tcp = 'tcp.' + port;
    let formData = {
        "chartName": "stable/nginx-ingress",
        "releaseName": release,
        "values": {
            tcp: serivceName + ":" + servicePort
        }
    }

    // send it to the helm service
    request.post({ url: Paths.HelmUpgrade, form: formData }, function (error, response, body) {
        if (error) {
            res.send({ 'error': error });
        }
        else {
            res.send(
                {
                    internal_port: servicePort,
                    external_port: port,
                    external_ip: ip,
                    ingressResponse: body
                }
            );
        }
    });
})
