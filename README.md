

# Helm Charts installation through http endpoints
## Enabling applications in your Kubernetes cluster to programmatically install helm charts and expose them through a single public facing IP.

The solution exposes web endpoint which provides the Helm functionalities of Install, Delete and Upgrade charts, as well as automatically configure the ingress controller to expose them to the internet all within a single public IP.
The solution we propose consists of two parts, both as web servers:

**Helm charts deployer**: let developers install, delete and upgrade helm charts from inside the cluster, using a simple REST API.

**Ingres rule setter**: expose installed helm charts to the internet, via a single IP.

### When to use this solution
* Automating deployments in the cluster.
* Programmatically managing the cluster from the code.

### Requirements
- Kubernetes 1.9+ with RBAC enabled.
- Helm
### Installation
1. Install [Helm](https://github.com/kubernetes/helm) with [RBAC](https://github.com/kubernetes/helm/blob/master/docs/rbac.md#tiller-and-role-based-access-control)

     Make sure to grant tiller sufficient permissions to run helm inside the cluster, and install the Autom8s Chart.
    The example below will configure helm and tiller to work with the chart's default values. Execute the following lines if using the default chart values:
    ```bash
    kubectl apply -f https://raw.githubusercontent.com/itye-msft/kubernetes-dynamic-deployment-service/master/rbac-example/tiller.yaml
    
    helm init --service-account tiller
    ```
2. Install the Autom8s chart
```bash
helm install   'https://raw.githubusercontent.com/itye-msft/Autom8s/master/chart/autom8s-0.1.0.tgz' --name autom8s --set rbac.create=true
```
3. Call autom8s and install `nginx-ingress-controller`, to expose other helm charts via a single public IP:
```bash
curl -d '{"chartName":"stable/nginx-ingress", "releaseName":"myingress"}' -H "Content-Type: application/json" -X POST http://<autom8s-ip>:4000/install
```
4. Label each ingress controller. This is required, since this is our way of telling the system, which IPs to use:
```bash
kubectl label service myingress appingress=ingress
```

Now you have a working Autom8s API awaiting HTTP requests. 



## Using the API
If you used the default settings, the API will be accessible internally at: `http://autom8s.default.svc.cluster.local:4000`

Here is a quick node.js snippet that makes use of the API to install RabbitMQ with default settings:

```js
let chart = { name: "stable/rabbitmq", servicePort: 5672 };

// perform helm install
var installResponse = await requestPostAsync(Paths.HelmInstall, { form: { chartName: chart.name } });

// create a rule to expose the new service expternally
var ingressResponse = await requestGetAsync(Paths.SetIngressRule, { serviceName: installResponse.serviceName, servicePort: chart.servicePort });

return "Your new service: " + ingressResponse.releaseName + ", is publicly accessibly on " + ingressResponse.ip + ":" + ingressResponse.port;
```

An example to install a chart with custom settings (same as using helm's `--set` flag):
```json
{
  "chartName":"stable/rabbitmq",
  "values": {
       "rabbitmq.username" : "admin" ,
       "rabbitmq.password" : "secretpassword",
       "rabbitmq.erlangCookie": "secretcookie"
    }
}
```
>`ReleaseName` optional, and if it's not set, helm will generate one for you. See the API documenation below for more details.

Installig a private chart is also simple:
```json
{
  "chartName":"sampleApp",
  "releaseName":"sampleApp1",
  "privateChartsRepo": "https://raw.githubusercontent.com/username/helm_repo/master/index.yaml"
}
```

## API Documentation
Check out the API documentation [here](./docs/api.md)

## How it works
Feel free to read the extended summary [here](./docs/deepdive.md)

## Contributing
Bug and Issues fixes as well as new features are welcome by creating a new pull request.