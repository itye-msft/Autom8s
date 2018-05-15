var express = require('express')
const Client = require('kubernetes-client').Client
const config = require('kubernetes-client').config;

let client;
try {
    client = new Client({ config: config.getInCluster(), version: '1.9' });
} catch (e) {
    client = new Client({ config: config.fromKubeconfig(), version: '1.9' });
}

const settings = {
    LoadBalancerNamespace : process.env.LoadBalancerNamespace || "default",
    IngressLabel: process.env.IngressLabel || "ingress",
    PortMin: process.env.PortMin || "9000",
    PortMax: process.env.PortMax || "9999"
}

var app = express()

app.get('/', function (req, res) {
  res.send('Service is running')
})

app.get('/getport', (request, response, next) => {
  
  let portsInUse = [];
  client.api.v1.namespaces(settings.LoadBalancerNamespace).services.get()
  .then(function(services){
      //select only load balancers
      let LoadBalancers = [];
      services.body.items.forEach(service => {
          if(service.spec.type == "LoadBalancer"){
            //match to label
            for(var key in service.metadata.labels){
                if(key == "appingress" && service.metadata.labels[key] == settings.IngressLabel){
                    LoadBalancers.push(service);
                }
            }
          }
      });

      if(LoadBalancers.length == 0){
          //exit with error
          response.send({"error":"Could not find any load balancers in namepspace: " + settings.LoadBalancerNamespace});
      }
      else{
          //prepare the load balancer to work with.
          let service = null;

          //If a specific LoadBlanacer was requested
          if(request.query.lbip!= undefined && request.query.lbip != ""){
              LoadBalancers.forEach(lb => {
                  if(lb.status.loadBalancer.ingress[0].ip == request.query.lbip){
                      service = lb;
                  }
              });
          }
          else {
              //Else, In order to alocate a free port evenly from the load balancers, select a random one.
              let randomServiceIndex = Math.floor((Math.random() * LoadBalancers.length) + 0);
              service = LoadBalancers[randomServiceIndex];
          }
          
          if(service == null){
              //exit with error
              response.send({"error":"Could not allocate load balancer"});
          }
          else {
                //list all the ports in use
                service.spec.ports.forEach(portItem => {
                    portsInUse.push(portItem.port);
                });
                
                //start searching for a free port
                let currentPort = parseInt(settings.PortMin);
                let max = parseInt(settings.PortMax);

                while(currentPort<=max && portsInUse.includes(currentPort)){
                    //while in ports
                    currentPort++;
                }
                response.send({
                    "public_ip": service.status.loadBalancer.ingress[0].ip,
                    "port": currentPort,
                    "release" : service.spec.selector.release
                });
          }   
      }
  }).catch(next);
  
});

app.listen(4000, function () {
  console.log('Listening on port 4000...')
})


