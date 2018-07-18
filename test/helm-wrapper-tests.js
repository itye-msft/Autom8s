var assert = require('assert');
var expect = require('chai').expect;
var should = require('chai').should(); 
var HelmWrapper = require('../autom8s/helm-wrapper');

describe('Ctor', function () {
    it('instance is created', function () {
        var hw = new HelmWrapper();
        assert.notEqual(hw, null);
    });
});

describe('helm', function () {
    it('Install returns correct service name', async function () {
        var hw = new HelmWrapper();
        //mock
        hw._executeHelm = async function(command, values = '') {
            return { error:'', json:'{ "releaseName": "eerie-bat", "resources": [ { "name": "v1/Role", "resources": [ "eerie-bat-rabbitmq-endpoint-reader" ] }, { "name": "v1/RoleBinding", "resources": [ "eerie-bat-rabbitmq-endpoint-reader" ] }, { "name": "v1/Service", "resources": [ "eerie-bat-rabbitmq" ] }, { "name": "v1beta2/StatefulSet", "resources": [ "eerie-bat-rabbitmq" ] }, { "name": "v1/Pod(related)", "resources": [ "eerie-bat-rabbitmq-0" ] }, { "name": "v1/Secret", "resources": [ "eerie-bat-rabbitmq" ] }, { "name": "v1/ConfigMap", "resources": [ "eerie-bat-rabbitmq-config" ] }, { "name": "v1/ServiceAccount", "resources": [ "eerie-bat-rabbitmq" ] } ] }' };
        }
        //act
        var res = await hw.install({ chartName: 'chart.name' });
        assert.equal(res.serviceName, 'eerie-bat-rabbitmq');
    });

    it('Delete', async function () {
        var hw = new HelmWrapper();
        //mock
        var data  = { releaseName: "eerie-bat" };
        
        hw._executeHelm = async function(command, values = '') {
            return command;
        }
        let cmd = 'delete ' + data.releaseName;
        //act
        var res = await hw.delete(data);
        assert.equal(res, cmd);
    });

    it('Upgrade', async function () {
        var hw = new HelmWrapper();
        //mock
        var data  = { releaseName: "eerie-bat", chartName:"eerie-bat-rabbitmq" };
        
        hw._executeHelm = async function(command, values = '') {
            return command;
        }
        let upgradeCommand = 'upgrade ' + data.releaseName + ' ' + data.chartName;
        //act
        var res = await hw.upgrade(data);
        assert.equal(res, upgradeCommand);
    });
});

