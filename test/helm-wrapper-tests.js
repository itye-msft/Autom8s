var assert = require('assert');
var expect = require('chai').expect;
var should = require('chai').should(); 
var HelmWrapper = require('../autom8s/helm-wrapper');

describe('Ctor', function () {
    it('instance is created', function () {
        let helmWrapper = new HelmWrapper();
        assert.notEqual(helmWrapper, null);
    });
});

describe('helm', function () {
    it('Install returns correct service name', async function () {
        //mock
        let helmWrapper = new HelmWrapper();
        helmWrapper._executeHelm = async function(command, values = '') {
            return { error:'', json:'{ "releaseName": "eerie-bat", "resources": [ { "name": "v1/Role", "resources": [ "eerie-bat-rabbitmq-endpoint-reader" ] }, { "name": "v1/RoleBinding", "resources": [ "eerie-bat-rabbitmq-endpoint-reader" ] }, { "name": "v1/Service", "resources": [ "eerie-bat-rabbitmq" ] }, { "name": "v1beta2/StatefulSet", "resources": [ "eerie-bat-rabbitmq" ] }, { "name": "v1/Pod(related)", "resources": [ "eerie-bat-rabbitmq-0" ] }, { "name": "v1/Secret", "resources": [ "eerie-bat-rabbitmq" ] }, { "name": "v1/ConfigMap", "resources": [ "eerie-bat-rabbitmq-config" ] }, { "name": "v1/ServiceAccount", "resources": [ "eerie-bat-rabbitmq" ] } ] }' };
        }
        //act
        var res = await helmWrapper.install({ chartName: 'chart.name' });
        assert.equal(res.serviceName, 'eerie-bat-rabbitmq');
    });

    it('Delete', async function () {
        //mock
        var data  = { releaseName: "eerie-bat" };
        
        let helmWrapper = new HelmWrapper();
        helmWrapper._executeHelm = async function(command, values = '') {
            return command;
        }
        let cmd = 'delete ' + data.releaseName;
        //act
        var res = await helmWrapper.delete(data);
        console.log(cmd)
        console.log(res)
        assert.equal(res, cmd);
    });

    it('Upgrade', async function () {
        //mock
        var data  = { releaseName: "eerie-bat", chartName:"eerie-bat-rabbitmq" };
        
        let helmWrapper = new HelmWrapper();
        helmWrapper._executeHelm = async function(command, values = '') {
            return command;
        }
        let upgradeCommand = 'upgrade ' + data.releaseName + ' ' + data.chartName;
        //act
        var res = await helmWrapper.upgrade(data);
        assert.equal(res, upgradeCommand);
    });
});

