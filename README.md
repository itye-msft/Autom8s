

# Project Autom8s - Automation for K8S
## Dynamically and automatically deploy applications to kubernetes cluster and expose them externally
This code shows how to deploy hundreds of applications to a Kubernetes cluster programmatically. It shows hpw to automate the process of deploying apps to a Kubernetes cluster, how to do it programmatically, and expose the apps to the internet using a single IP.

The appplication manages the flow of events required to achieve this level of automation. 


## Installation
Autom8s creates a single image which exposes several HTTP API endpoints for immediate use.

To install Autom8s in your cluster and configure it correctly use the following command:

```
kubectl apply -f https://raw.githubusercontent.com/itye-msft/kubernetes-dynamic-deployment-service/master/deployment.yaml
```
Once the environment is ready, you also need to install your first nginx-ingress-controller:

```helm install stable/nginx-ingress```

And make sure to label it correctly to work:

```kubectl label service <nginx-ingress-controller-release-name> appingress=ingress```

## Using the code
Once installed you can make direct calls to the API:
* Helm install: `http://[ip-of-autom8s-service]:4000/install`
* Helm delete: `http://[ip-of-autom8s-service]:4000/delete`
* Helm upgrade: `http://[ip-of-autom8s-service]:4000/upgrade`

Example: installing RabbitMQ
```
http post [ip-of-autom8s-service]:4000/install
{
  "chartName":"stable/nginx-rabbitmq"
}
```

If you are interested in more granular functionality:
* Ip-Manager: `http://[ip-of-autom8s-service]:4000/getport`
* Ingress-Manager: `http://[ip-of-autom8s-service]:4000/setrule`

A working example can be found in the [sample app](/tree/master/SampleApp).