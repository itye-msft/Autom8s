const util = require('util');
const exec = util.promisify(require('child_process').exec);

const helmBinaryLocation = process.env.HELM_BINARY;
/** Since autom8s is installed via a Chart, init was already been called, no need to init again.
 * We are leaving this as a comment, in case someone will need to execute it when autom8s is
 * installed via yaml files
 */
// console.log('Initializing tiller with service account: ' + process.env.TILLER_SERVICE_ACCOUNT);
// exec(helmBinaryLocation + ' init --service-account ' + process.env.TILLER_SERVICE_ACCOUNT);

// Run once init client only (because tiller is already installed, see above)
exec(`${helmBinaryLocation} init --client-only`);

class HelmWrapper {
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
    // will match one and only one of the string 'true','1', or 'on' rerardless
    // of capitalization and regardless off surrounding white-space.
    //
    const regex = /^\s*(true|1|on)\s*$/i;

    return regex.test(obj.toString());
  }

  static async install(deployOptions) {
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
          const svc = HelmWrapper._findFirstService(json);
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

  static async delete(delOptions) {
    const { releaseName } = delOptions;
    console.log(`deleting release: ${releaseName}`);

    return this._executeHelm(`delete ${releaseName}`);
  }

  static async upgrade(deployOptions) {
    const chartName = deployOptions.chartName.toLowerCase();
    const releaseName = deployOptions.releaseName.toLowerCase();
    const upgradeCommand = `upgrade ${releaseName} ${chartName}`;
    console.log(`upgradeCommand command: ${upgradeCommand}`);

    return HelmWrapper._innerInstallUpgrade(upgradeCommand, deployOptions);
  }

  static async _executeHelm(command, values = '') {
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
        configStr += ` --set ${  attribute  }=${  deployObject[attribute]}`;
      }
    }
    return configStr;
  }

  static async _innerInstallUpgrade(command, deployOptions) {
    let updateCmd = command;
    const chartName = deployOptions.chartName.toLowerCase();

    if (deployOptions.privateChartsRepo) {
      const tokens = chartName.split('/');
      // adds the private repo to helm known repos
      await HelmWrapper._executeHelm(`repo add ${tokens[0]} ${deployOptions.privateChartsRepo}`);
      // fetch the data from all known repos
      await HelmWrapper._executeHelm('repo update');
    }

    if (deployOptions.reuseValue !== undefined
      && HelmWrapper._convertToBool(deployOptions.reuseValue)) {
      updateCmd += ' --reuse-values ';
    }

    // install the chart from one of the known repos
    return HelmWrapper._executeHelm(updateCmd, this._getConfigValues(deployOptions.values));
  }
}

module.exports = HelmWrapper;
