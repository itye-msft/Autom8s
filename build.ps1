docker build -t k8s-port-service .\k8s-port-service
docker tag k8s-port-service ityer/k8s-port-service:v12
docker push ityer/k8s-port-service:v12

docker build -t k8s-deploy-service-sample .\SampleApp
docker tag k8s-deploy-service-sample ityer/k8s-deploy-service-sample:v1
docker push ityer/k8s-deploy-service-sample:v1

