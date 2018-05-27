# helm-charts-deployer-node-server
A standalone NodeJs web server that handle helm commands (install / delete / upgrade)

## Option 1 - Deploy a chart from a public repository:
Submit a POST request:
With the given body as 'json/application'

```json
{
   "chartName": "stable/nginx-ingress",
   "releaseName": "release101",
   "values": {
       "key1" : 1,
       "key2" : "value2"   
    }
}
```

## Option 2 - Deploy a chart from a PRIVATE repository:
Submit a POST request:
With the given body as json/application

```json
{
   "chartName": "helmrepo/simpletest",
   "privateChartsRepo": "https://raw.githubusercontent.com/username/charts_test/master/",
   "releaseName": "release101",
   "values": {
       "key1" : 1,
       "key2" : "value2"   
    }
}
```

The server can run either locally or on a Kubernetes cluster.

## Installation on AKS (Azure Kubernetes service)
### Prerequisites
1) Azure subscription
2) AKS cluster
3) ACR (Azure Container Registry)
4) Docker installed locally (for building the image)

### Installation
1) Build the docker image (d)
```bash
az aks get-credentials --resource-group <rgName> --name <aksClusterName>
docker build -t my/helm-web-server .
```
2) Tag the image
```bash
docker tag my/helm-web-server <acrname>.azurecr.io/helmserver
```

3) Push the image to ACR (https://docs.microsoft.com/en-us/azure/container-registry/container-registry-get-started-docker-cli)\
```bash
docker login myregistry.azurecr.io -u xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx -p myPassword
docker push <acrname>.azurecr.io/helmserver
```

4) Deploy the server to AKS
```bash
kubectl create -f serviceAccount.yaml
kubectl create -f service.yaml
kubectl create -f deployment.yaml
```

Note: in the case that the image that the (custom) chart is using is on a private container registry, set secret should be applied to the cluster using kubectl so fetching of the image would be possible.