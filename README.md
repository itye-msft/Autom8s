# Kubernetes ingress port service
An internal cluster service to manage available external ports for ingress rules. 

## Motivation
Sometime one would like to automate the process of creating ingress rules. Creating an ingress rule is relatively easy using [nginx ingress conroller](https://hub.kubeapps.com/charts/stable/nginx-ingress) and configuring it manually is [also simple](https://medium.com/cooking-with-azure/tcp-load-balancing-with-ingress-in-aks-702ac93f2246) by specifying the desired expternal port.

However, there is jsut no way to ask the controller to automatically select an available port, unless you make your service a load-balancer, which is not desired in most cases due to secutiry reasons.

This port-service provides http api to find an available port in the given load-balancer, in order to use it later to create an ingress rule.

## How to use it
Either edit or run the default `deployment.yaml` file:
```
kubectl apply -f https://raw.githubusercontent.com/itye-msft/kubernetes-dynamic-deployment-service/port-service/deployment.yaml
```
This will deploy the port-service into your cluster. Once deployed it can be accessed internally from:
`http://<port-service-name>.<namespace>.svc.cluster.local/getport`

If you used the default `deployment.yaml` file the internal url would be:
`http://port-service.ingress.svc.cluster.local/getport`

The response format is:
```json
{ 
    "public_ip":"104.214.218.79",
    "port":20000,
    "release":"myapp"
}
```
* `public_ip` is the load balancer external ip. 
* `port` is an avaialble external port to use with the ingress rule.
* `release` is an optional value that describes the load balancer's release.

Using this information you can create an ingress rule without managing yourself the port state.


## How it works
Ingress rules are configured in the ingress controller. There could be several ingress controllers in the cluster.

In order for the port-service to find a free port, it first needs to pick one ingress controller. The ingress controllers can be found by:
1. specifying a namespace where the ingress controllers were deployed.
2. adding the `appingress` label to each ingress controller you would like to use with the port-service, for better granularity. The value of the label can be set in the `deployment.yaml` file.

Once all the applicable ingress controllers were found, the system will do **one** of the followings:
1. pick a random controller and find a free port.

-or-

2. pick the controller specified in the http request by using the following format: `http://<port-service-name>.<namespace>.svc.cluster.local/getport?lbip=x.x.x.x`

For example:
`http://port-service.ingress.svc.cluster.local/getport?lbip=1.2.3.4`

Finding a free port follows a simple pattern:

1. Get all currently-in-use ports by making an api call.
2. Iterate the port range to find a port not in use.


## License
MIT
