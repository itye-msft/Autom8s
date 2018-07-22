const express = require('express');
const util = require('util');
const request = require('request');

const requestPostAsync = util.promisify(request.post);
const requestGetAsync = util.promisify(request.get);

const router = express.Router();
const autom8sUrl = 'localhost';
const Paths = {
  HelmInstall: `http://${autom8sUrl}:4000/install`,
  SetIngressRule: `http://${autom8sUrl}:4000/setrule`,
};

async function InstallChart(chart) {
  try {
    // perform helm install
    let installResponse = await requestPostAsync(
      Paths.HelmInstall, { form: { chartName: chart.name } },
    );
    installResponse = JSON.parse(installResponse.body);

    // create a rule to expose the new service expternally
    let ingressResponse = await requestGetAsync(
      Paths.SetIngressRule,
      { serviceName: installResponse.serviceName, servicePort: chart.servicePort },
    );
    ingressResponse = JSON.parse(ingressResponse.body);

    if (ingressResponse.status === 'success') {
      return `Your new service: ${ingressResponse.releaseName}, is publicly accessibly on ${ingressResponse.ip}:${ingressResponse.port}`;
    }

    return `failed: ${ingressResponse.reason}`;
  } catch (error) {
    console.log(error);
    return 'failed';
  }
}

router.get('/test',
  async (req, res) => {
    const chart = { name: 'stable/rabbitmq', servicePort: 5672 };
    const installChartResult = await InstallChart(chart);
    res.send(installChartResult);
  });

module.exports = router;
