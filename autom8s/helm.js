﻿const util = require('util');
const exec = util.promisify(require('child_process').exec);

const helmBinaryLocation = process.env.HELM_BINARY;
/** Since autom8s is installed via a Chart, init was already been called, no need to init again.
 * We are leaving this as a comment, in case someone will need to execute it when autom8s is
 * installed via yaml files
 */
// console.log('Initializing tiller with service account: ' + process.env.TILLER_SERVICE_ACCOUNT);
// exec(helmBinaryLocation + ' init --service-account ' + process.env.TILLER_SERVICE_ACCOUNT);

// Run once init client only (because tiller is already installed, see above)
console.log(`initializing helm client. helm binary: ${helmBinaryLocation}`);
exec(`${helmBinaryLocation} init --client-only`);

class Helm {
  async install(deployOptions) {
    console.log(`Installing new chart. deployOptions:${JSON.stringify(deployOptions)}`);
    const chartName = deployOptions.chartName.toLowerCase();
    const { releaseName } = deployOptions;
    let installCommand = `json install ${chartName}`;

    if (releaseName !== undefined && releaseName != null && releaseName !== '') {
      installCommand = `${installCommand} --name ${releaseName.toLowerCase()}`;
      console.log(`Install command: ${installCommand}`);
    }

    return this._innerInstallUpgrade(installCommand, deployOptions)
      .then((responseData) => {
        if (responseData.error) {
          throw new Error(`Install command failed: ${responseData.error}`);
        } else {
          const json = JSON.parse(responseData.json);
          const svc = Helm._findFirstService(json);
          if (svc) {
            return {
              serviceName: svc,
              releaseName: json.releaseName,
            };
          }

          throw new Error(`Install command returned unknown response: ${responseData.json}`);
        }
      });
  }

  async delete(delOptions) {
    const { releaseName } = delOptions;
    console.log(`deleting release: ${releaseName}`);

    return this._executeHelm(`delete ${releaseName}`);
  }

  async upgrade(deployOptions) {
    const chartName = deployOptions.chartName.toLowerCase();
    const releaseName = deployOptions.releaseName.toLowerCase();
    const upgradeCommand = `upgrade ${releaseName} ${chartName}`;
    console.log(`upgradeCommand command: ${upgradeCommand}`);

    return this._innerInstallUpgrade(upgradeCommand, deployOptions);
  }

  static _findFirstService(json) {
    let name = null;
    json.resources.forEach((element) => {
      if (element.name === 'v1/Service') {
        name = element.resources[0];
      }
    });
    return name;
  }

  static _convertToBool(obj) {
    if (obj == null) {
      return false;
    }
    // will match one and only one of the string 'true','1', or 'on' regardless
    // of capitalization and regardless of surrounding white-space.
    //
    const regex = /^\s*(true|1|on)\s*$/i;

    return regex.test(obj.toString());
  }

  async _executeHelm(command, values = '') {
    const { stdout, stderr } = await exec(`${helmBinaryLocation} ${command}${values}`);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
    return { error: stderr, json: stdout };
  }

  static _getConfigValues(deployObject) {
    if (this.deployObject) {
      return '';
    }

    let configStr = '';
    for (const attribute in deployObject) {
      if (deployObject.hasOwnProperty(attribute)) {
        configStr += ` --set ${attribute}=${deployObject[attribute]}`;
      }
    }
    return configStr;
  }

  async _innerInstallUpgrade(command, deployOptions) {
    let updatedCmd = command;
    const chartName = deployOptions.chartName.toLowerCase();

    // when requesting install from a private repository,
    // helm repositories list must be updated first
    if (deployOptions.privateChartsRepo) {
      const tokens = chartName.split('/');
      // adds the private repo to helm known repos
      await this._executeHelm(`repo add ${tokens[0]} ${deployOptions.privateChartsRepo}`);
      // fetch the data from all known repos
      await this._executeHelm('repo update');
    }

    if (deployOptions.reuseValue !== undefined
      && Helm._convertToBool(deployOptions.reuseValue)) {
      updatedCmd += ' --reuse-values ';
    }

    // install the chart from one of the known repos
    return this._executeHelm(updatedCmd, Helm._getConfigValues(deployOptions.values));
  }
}

module.exports = Helm;
