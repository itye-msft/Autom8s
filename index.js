var express = require('express')
const Client = require('kubernetes-client').Client
const config = require('kubernetes-client').config;

//setup an API client
let client;
try {
    //assuming we are in the pod, try get the credentials from account service
    client = new Client({ config: config.getInCluster(), version: '1.9' });
} catch (e) {
    //we must be debugging locally, than pickup credentials from kube config
    client = new Client({ config: config.fromKubeconfig(), version: '1.9' });
}

//gather settings to operate
const settings = {
    LoadBalancerNamespace: process.env.LoadBalancerNamespace || "default",
    IngressLabel: process.env.IngressLabel || "ingress",
    PortMin: process.env.PortMin || "20000",
    PortMax: process.env.PortMax || "30000",
    ServingPort: 4000
}

//start serving requests
var app = express()
app.listen(settings.ServingPort, function () {
    console.log('Listening on port ' + settings.ServingPort);
})


app.get('/', function (req, res) {
    res.send('Service is running');
});

app.get('/getexistingports', (request, response, next) => {
    client.api.v1.namespaces(settings.LoadBalancerNamespace).services.get()
        .then(function (services) {
            //select only load balancers
            let LoadBalancers = getLoadBalancersByLabel(services);
            let list = listPorts(LoadBalancers);
            response.send(list);
        })
        .catch(next);
})

app.get('/getport', (request, response, next) => {

    //make an API call for all services in the given namespace
    client.api.v1.namespaces(settings.LoadBalancerNamespace).services.get()
        .then(function (services) {
            //select only load balancers
            let LoadBalancers = getLoadBalancersByLabel(services);

            if (LoadBalancers.length == 0) {
                //exit with error
                response.send({ "error": "Could not find any load balancers in namepspace: " + settings.LoadBalancerNamespace });
            }
            else {
                //prepare the load balancer to work with.
                let service = null;

                //If a specific LoadBlanacer was requested by IP
                if (request.query.lbip != undefined && request.query.lbip != "") {
                    service = getLoadBalancerByIP(LoadBalancers, request.query.lbip)
                }
                else {
                    //Else, In order to alocate a free port evenly from the load balancers, select a random one.
                    service = getRandomLoadBalancer(LoadBalancers);
                }

                if (service == null) {
                    //exit with error
                    response.send({ "error": "Could not allocate load balancer" });
                }
                else {

                    let freeProt = getFreePort(service);
                    response.send({
                        "public_ip": service.status.loadBalancer.ingress[0].ip,
                        "port": freeProt,
                        "release": service.spec.selector.release
                    });
                }
            }
        })
        .catch(next);
});

//Helper functions

function getLoadBalancerByIP(LoadBalancers, IP) {
    LoadBalancers.forEach(lb => {
        if (lb.status.loadBalancer.ingress[0].ip == IP) {
            return lb;
        }
    });
    return null;
}

function getRandomLoadBalancer(LoadBalancers) {
    let randomServiceIndex = Math.floor((Math.random() * LoadBalancers.length) + 0);
    return LoadBalancers[randomServiceIndex];
}

function getFreePort(service) {
    var portsInUse = [];

    service.spec.ports.forEach(portItem => {
        portsInUse.push(portItem.port);
    });

    //start searching for a free port
    let currentPort = parseInt(settings.PortMin);
    let max = parseInt(settings.PortMax);

    while (currentPort <= max && portsInUse.includes(currentPort)) {
        //while in ports
        currentPort++;
    }
    return currentPort;
}

function getLoadBalancersByLabel(services) {
    //select only load balancers
    let LoadBalancers = [];
    services.body.items.forEach(service => {
        if (service.spec.type == "LoadBalancer") {
            //match to label if applicable
            if (settings.IngressLabel != null && settings.IngressLabel != "") {
                for (var key in service.metadata.labels) {
                    //we are looking for a pre-defined label call appingress, having a value setup in env variable
                    if (key == "appingress" && service.metadata.labels[key] == settings.IngressLabel) {
                        LoadBalancers.push(service);
                    }
                }
            }
            else {
                //if no labels are defined, than take load balancers
                LoadBalancers.push(service);
            }
        }
    });
    return LoadBalancers;
}

function listPorts(LoadBalancers){
    var list = [];
    LoadBalancers.forEach(service => {
        service.spec.ports.forEach(portItem => {
            list.push({
                "external_port": portItem.port,
                "node_port": portItem.nodePort,
                "protocol": portItem.protocol,
                "name": portItem.name,
                "public_ip": service.status.loadBalancer.ingress[0].ip,
                "release": service.spec.selector.release
            });
        });
    });
    return list;
}
