const PortService = require('./port-service');
const HelmWrapper = require('./helm-wrapper');

class IngressManager {
  async setRule(serviceName, servicePort, specificport, specificlb, specificrelease) {
    const ipPortRelease = await this._getIpPortRelease(
      specificport, specificlb, specificrelease,
    );
    console.log(`Ingress port response: ${JSON.stringify(ipPortRelease)}`);
    // prepare data to post
    const tcp = `tcp.${ipPortRelease.port}`;
    const v = {};
    v[tcp] = `${serviceName}:${servicePort}`;
    const upgradeOptions = {
      chartName: 'stable/nginx-ingress',
      reuseValue: true,
      releaseName: ipPortRelease.release,
      values: v,
    };

    // send it to the helm service
    const helmWrapper = this._factoryGetHelmWrapper();
    console.log('Ingress Calling helm upgrade');
    const upgradeResponse = await helmWrapper.upgrade(upgradeOptions);
    console.log(`Ingress Helm upgrade repsonse:${JSON.stringify(upgradeResponse)}`);
    return {
      ip: ipPortRelease.ip,
      port: ipPortRelease.port,
      releaseName: ipPortRelease.release,
    };
  }

  async _getIpPortRelease(specificport, specificlb, specificrelease) {
    // if specific port/ip/release were requested:
    if (specificport !== undefined && specificport !== ''
    && specificlb !== undefined && specificlb !== ''
    && specificrelease !== undefined && specificrelease !== '') {
      return { ip: specificlb, port: specificport, release: specificrelease };
    }

    // get free port/ip/release
    const ps = this._factoryGetPortService();
    console.log('Ingress Calling get port');
    const data = await ps.getPort();
    const ip = data.public_ip;
    const { port } = data;
    const { release } = data;

    return { ip, port, release };
  }

  _factoryGetPortService() { return new PortService(); }

  _factoryGetHelmWrapper() { return new HelmWrapper(); }
}


module.exports = IngressManager;
