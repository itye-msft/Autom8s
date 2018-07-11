var portService = require('../k8s-port-service/port-service');
const HelmWrapper = require("../k8s-helm-http-wrapper/helm-wrapper");

class IngressManager {

    async setRule(serviceName, servicePort, specificport, specificlb, specificrelease) {
        var ipPortRelease = await this._getIpPortRelease(specificport, specificlb, specificrelease);
        
        //prepare data to post
        let tcp = 'tcp.' + ipPortRelease.port;
        let v = {};
        v[tcp] = serviceName + ":" + servicePort;
        let upgradeOptions = {
            "chartName": "stable/nginx-ingress",
            reuseValue: true,
            "releaseName": ipPortRelease.release,
            "values": v
        }

        // send it to the helm service
        let helmWrapper = new HelmWrapper();
        await helmWrapper.upgrade(upgradeOptions)
        return {
            ip: ipPortRelease.ip,
            port: ipPortRelease.port,
            releaseName: ipPortRelease.release
        };
    }

    async _getIpPortRelease(specificport, specificlb, specificrelease) {
        let port = '', ip = '', release = '';
        //if specific port/ip/release were requested:
        if (specificport != undefined && specificport != "" &&
            specificlb != undefined && specificlb != "" &&
            specificrelease != undefined && specificrelease != "") {
            ip = specificlb;
            port = specificport;
            release = specificrelease;
    
            return { ip:ip, port:port, release:release};
        }
        else {
            //get free port/ip/release
            let ps = new portService();
            return await ps.getPort()
            .then((data)=> {
                ip = data.public_ip;
                port = data.port;
                release = data.release;
                
                return { ip:ip, port:port, release:release};
            });
        }
    }
}


module.exports = IngressManager;