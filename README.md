

# Project Autom8s - Automation for K8S
## Enabling applications in your Kubernetes cluster to programmatically install helm charts and expose them through a single public facing IP.

The solution we propose consists of two services:

**Helm as a service**: let developers manage helm charts from inside the cluster, using a simple REST API.

**Expose as a service**: expose installed helm charts to the internet, via a single IP.

### When to use this  solution
* When you need to automate deployments in your cluster.
* Performing automation tests.
* When you need to programmatically manage the cluster from your code.

## Installation
Installing autom8s takes 3 steps:

1. Grant tiller sufficient permissions to run helm inside the cluster, and install the Autom8s Chart.
```bash
kubectl apply -f https://raw.githubusercontent.com/itye-msft/kubernetes-dynamic-deployment-service/master/setup/tiller.yaml
helm init --service-account tiller
helm install 'https://raw.githubusercontent.com/itye-msft/Autom8s/master/chart/autom8s-0.1.0.tgz' --name autom8s --set rbac.create=true
```
2. Call autom8s and install `nginx-ingress-controller`, to expose other helm charts via a single public IP:
```bash
curl -d '{"chartName":"stable/nginx-ingress", "releaseName":"myingress"}' -H "Content-Type: application/json" -X POST http://<autom8s-ip>:4000/install
```
3. Label each ingress controller. This is required, since this is our way of telling the system, which IPs to use:
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
Here are the available endpoints of the API:
### /install
| Name | Http Action | Description | Paramaters type|
| ---  | ----         | ----        | ---           |
| install | POST | install a helm chart | json |

**Paramaters**

| Name | Description | Optional|
| ---  | ----         | ----        |
| chartName | name of the chart | mandatory |
| releaseName | set the release name. If not present, helm will generate one for you. | optional |
| privateChartsRepo | a URL to your own custom repo. Credentials may be incorporated in the URL in the form of: `https://user:token@domain/git/repo/path` | optional |
| values | a key-value object of values to set | optional |
---
### /upgrade
| Name | Http Action | Description | Paramaters type|
| ---  | ----         | ----        | ---           |
| upgrade | POST | upgrade a helm release | json |

**Paramaters**

| Name | Description | Optional|
| ---  | ----         | ----        |
| chartName | name of the chart | mandatory |
| releaseName | the release name to upgrade | mandatory |
| reuseValue | should the upgrade override values or append | optional |

---
### /delete
| Name | Http Action | Description | Paramaters type|
| ---  | ----         | ----        | ---           |
| upgrade | POST | delete a helm release | json |

**Paramaters**

| Name | Description | Optional|
| ---  | ----         | ----        |
| releaseName | the release name to delete | mandatory |

---
### /setrule
| Name | Http Action | Description | Paramaters type|
| ---  | ----         | ----        | ---           |
| setrule | POST | create an ingress rule | json |

**Paramaters**

| Name | Description | Optional|
| ---  | ----         | ----        |
| serviceName | the name of the installed service to expose | mandatory |
| servicePort | the internal port of the installed service to expose | mandatory |
| specificlb | a specific IP to use. If not specified, a random load balancer IP will be selected | optional |
| specificport | a specific port to use. If not specified, a random port will be selected | optional |
| specificrelease | a specific load balancer release to use. If not specified, a random load balancer will be selected | optional |

---
## Deep dive into the code
### Helm as a service
### Expose as a service
When we publicly expose an app, the final result would be a public IP and Port endpoint.

In order to have multiple apps deployed using a single IP, we initially thought to use [Traefik](https://traefik.io/) as an ingress controller, however, at the time of writing, Traefik supported only HTTP protocol, while IoT devices use a plethora of protocols, such as TCP, UDP, MQTT and more. Enter [Nginx Ingress Controller](https://hub.kubeapps.com/charts/stable/nginx-ingress). nginx allows customizing the protocols, it had an official helm chart, which really made the [setup](https://medium.com/cooking-with-azure/tcp-load-balancing-with-ingress-in-aks-702ac93f2246) and management super easy.

After the app was installed, we had to find a simple way to choose a free external port. It appeared that kubernetes is not provisioning and managing ingress controller ports. Having no other solution, we implemented a simple port-allocator which finds an available port in the ingress controllers.

### How the automation works
It takes 2 steps:

1. Get an available port, using Port-Manager.
2. Configure the ingress controller, using Ingress-Manager.

Ingress rules are configured in the ingress controller. There could be several ingress controllers in the cluster.

The Port-Manager finds a free port on an Ingress Controller. If there are multiple Ingress Controllers, one of the ingress controller is selected by:

1. Specifying a namespace where the ingress controllers were deployed. The namespace is set in an Environment Variable called LoadBalancerNamespace .
2. Adding the appingress  label to each ingress controller you would like to use with the Port-Manager, for better granularity. The value of the label is set in an Environment variable called IngressLabel .

Once all the applicable ingress controllers were found, the system will perform one of the followings:

1. Pick a random controller and find a free port.

-or-

2. Pick the controller specified in the HTTP request by setting the lbip parameter in the query string.

For example: http://<automates-service-url>/getport?lbip=1.2.3.4

 

Finding a free port follows a simple pattern:

1. Get all currently-in-use ports by making an API call.
2. Iterate the desired port range to find a port not in use.
