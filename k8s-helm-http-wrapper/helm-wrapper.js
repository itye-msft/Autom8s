'use strict';
const util = require('util');
const exec = util.promisify(require('child_process').exec);

class HelmWrapper {
    
    constructor() {
        this.initialized = false;
        this.helmBinaryLocation = process.env.HELM_BINARY;
    }

    async init() {
      if (this.initialized == true) {
        return;
      }
      
      await exec(this.helmBinaryLocation + ' init --service-account tiller');
      this.initialized = true;
    }

    async install(deployOptions) {
        if (this.initialized == false) {
          throw new Error("Object not initialized");
        }

        let chartName = deployOptions.chartName.toLowerCase();
        let releaseName = deployOptions.releaseName;
        let installCommand = 'json install ' + chartName;

        if (releaseName != undefined && releaseName != null && releaseName != "") {
            installCommand = installCommand + ' --name ' + releaseName.toLowerCase();
        }
        var self = this;
        return await this._innerInstallUpgrade(installCommand, deployOptions)
            .then((responseData) => {
                if(responseData.error){
                    throw new Error("Install command failed: " + responseData.error);
                }
                else{
                    let json = JSON.parse(responseData.json);
                    let svc = self._findFirstService(json);
                    if (svc) {
                        return {
                            serviceName: svc,
                            releaseName: json.releaseName,
                            chartName: chartName
                        };
                    }
                    else {
                        throw new Error("Install command returned unknown response: " + responseData.json);
                    }
                }
                
                
            })

    }

    async delete(delOptions) {
        if (this.initialized == false) {
          throw new Error("Object not initialized");
        }
        
        let releaseName = delOptions.releaseName;
        return await this._executeHelm('delete ' + releaseName);
    }

    async upgrade(deployOptions) {
        if (this.initialized == false) {
          throw new Error("Object not initialized");
        }
        
        let chartName = deployOptions.chartName.toLowerCase();
        let releaseName = deployOptions.releaseName.toLowerCase();
        let upgradeCommand = 'upgrade ' + releaseName + ' ' + chartName;

        return await this._innerInstallUpgrade(upgradeCommand, deployOptions);
    }

    async _executeHelm(command, values = '') {
        if (this.initialized == false) {
          throw new Error("Object not initialized");
        }

        const { stdout, stderr } = await exec(this.helmBinaryLocation + ' ' + command + values);
        console.log('stdout:', stdout);
        console.log('stderr:', stderr);
        return { error:stderr, json:stdout };
    }

    _getConfigValues(deployObject) {
        if (!deployObject) {
            return "";
        }

        let configStr = '';
        for (let attribute in deployObject) {
            if (deployObject.hasOwnProperty(attribute)) {
                configStr += ' --set ' + attribute + '=' + deployObject[attribute]
            }
        }
        return configStr;
    }

    async _innerInstallUpgrade(command, deployOptions) {
        if (this.initialized == false) {
          throw new Error("Object not initialized");
        }

        let chartName = deployOptions.chartName.toLowerCase();

        if (deployOptions.privateChartsRepo) {
            var tokens = chartName.split("/");
            // adds the private repo to helm known repos
            await this._executeHelm("repo add " + tokens[0] + " " + deployOptions.privateChartsRepo);
            // fetch the data from all known repos
            await this._executeHelm("repo update");
        }

        if (deployOptions.reuseValue != undefined && this._convertToBool(deployOptions.reuseValue)) {
            command = command + " --reuse-values ";
        }

        // install the chart from one of the known repos
        return await this._executeHelm(command, this._getConfigValues(deployOptions.values));
    }

    _findFirstService(json) {
        let name = null;
        json.resources.forEach(element => {
            if (element.name == "v1/Service") {
                name = element.resources[0];
            }
        });
        return name;
    }

    _convertToBool(obj) {
        if (obj == null) {
            return false;
        }
        // will match one and only one of the string 'true','1', or 'on' rerardless
        // of capitalization and regardless off surrounding white-space.
        //
        let regex = /^\s*(true|1|on)\s*$/i

        return regex.test(obj.toString());
    }
}

module.exports = HelmWrapper;