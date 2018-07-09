docker build -t dotnet-node-alpine .\docker-dotnet-node-alpine
docker tag dotnet-node-alpine ityer/dotnet-node-alpine:net2.1-node9.11-alpine3.7
docker push ityer/dotnet-node-alpine:net2.1-node9.11-alpine3.7

docker build -t k8s-port-service .\k8s-port-service
docker tag k8s-port-service ityer/k8s-port-service:v14
docker push ityer/k8s-port-service:v14

docker build -t k8s-helm-http-wrapper .\k8s-helm-http-wrapper
docker tag k8s-helm-http-wrapper ityer/k8s-helm-http-wrapper:v3
docker push ityer/k8s-helm-http-wrapper:v3

docker build -t k8s-ingress-manager .\k8s-ingress-manager
docker tag k8s-ingress-manager ityer/k8s-ingress-manager:v2
docker push ityer/k8s-ingress-manager:v2

docker build -t k8s-deploy-service-sample .\SampleApp
docker tag k8s-deploy-service-sample ityer/k8s-deploy-service-sample:v3
docker push ityer/k8s-deploy-service-sample:v3

