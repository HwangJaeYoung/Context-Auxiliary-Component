/**
 * Created by JaeYoungHwang on 2017-03-07.
 * forest62590@gmail.com
 */

// extract the modules
var async = require('async');
var getFiwareDeviceFunction = require('./FIWARE/FiwareQueryEntity');
var getFiwareDeviceSimpleFunction = require('./FIWARE/FiwareQueryEntitySimple');
var subFiwareDeviceFunction = require('./FIWARE/FiwareSubscription');
var unsubFiwareDeviceFunction = require('./FIWARE/FiwareUnsubscription');

var iterationEntityQuery = function(fiwareDeviceInfo, fiwareControllerCallback) {
    var count = 0;
    var deviceLists = fiwareDeviceInfo.getDeviceNumber();

    // JSON Structure for presenting FIWARE devices
    var deviceObjectRoot = new Object();
    var fiwareDevicesObject = new Object();
    var fiwareDeviceInfoObject = new Object();

    async.whilst(
        function () { return count < deviceLists; },

        function (async_for_loop_callback) {
            getFiwareDeviceFunction.getFiwareDevice(fiwareDeviceInfo.entityName[count], fiwareDeviceInfo.entityType[count], function(statusCode, responseObject) {

                if(statusCode == 200) { // request success
                    // Defining FIWARE Device
                    var deviceName = "device" + (count + 1);
                    deviceObjectRoot[deviceName] = responseObject;

                    // Checking for iteration
                    count++; async_for_loop_callback(null, count);
                } else { // request fail
                    async_for_loop_callback(statusCode); // calling error function
                }
            });
        },
        function (statusCode, n) {
            if (statusCode) {
                fiwareControllerCallback(false, statusCode, null);
            } else {
                console.log("All Fiware Device Retrieve is finished");
                fiwareDeviceInfoObject.deviceInfo = deviceObjectRoot;
                fiwareDevicesObject.FiwareDevices = fiwareDeviceInfoObject;
                fiwareControllerCallback(true, 200, fiwareDevicesObject);
            }
        }
    );
};

var iterationEntityQuerySimple = function(fiwareIPAddr, fiwareEntityType, fiwareControllerCallback) {
    getFiwareDeviceSimpleFunction.getFiwareDevice(fiwareIPAddr, fiwareEntityType, function(statusCode, responseObject) {
        if(statusCode == 200) { // request success
            fiwareControllerCallback(true, statusCode, responseObject);
        } else { // request fail
            fiwareControllerCallback(false, statusCode, null);
        }
    });
};

var iterationEntitySubscription = function(count, fiwareDeviceInfo, fiwareControllerCallback) {

    var selectedDevices = fiwareDeviceInfo['FiwareDevices']; // Root
    var deviceInfo = selectedDevices.deviceInfo;
    var deviceKey = [Object.keys(deviceInfo)[count]]; // device1, device2, ... , deviceN
    var device = deviceInfo[deviceKey];

    subFiwareDeviceFunction.subFiwareDevice(device, function(statusCode, subscriptionID) {
        // Checking for iteration
        if(statusCode == 201) { // request success
            fiwareControllerCallback(true, statusCode, subscriptionID + '\n');
        } else { // request fail
            fiwareControllerCallback(false, statusCode, null);
        }
    })
};

var iterationEntityUnsubscription = function(subscriptionIDArray, fiwareControllerCallback) {

    var count = 0;

    async.whilst(
        function () { return count < subscriptionIDArray.length - 1; },

        function (async_for_loop_callback) {
            // Checking for iteration
            unsubFiwareDeviceFunction.unsubFiwareDevice(subscriptionIDArray[count], function(statusCode) {
                // Unsubscribing operation success
                if(statusCode == 204) { // No Content
                    count++; async_for_loop_callback(null, count);
                } else {  // Unsubscribing operation fail
                    async_for_loop_callback(statusCode);
                }
            });
        },
        function (statusCode, n) {
            if (statusCode) { // fail
                fiwareControllerCallback(false, statusCode);
            } else { // success
                console.log("Fiware Device Unsubscription is finished");
                fiwareControllerCallback(true, statusCode);
            }
        }
    );
};

exports.executeQueryEntity = function(fiwareDeviceInfo, fiwareControllerCallback) {
    iterationEntityQuery(fiwareDeviceInfo, fiwareControllerCallback);
};

exports.executeQueryEntitySimple = function(fiwareIPAddr, fiwareEntityType, fiwareControllerCallback) {
    iterationEntityQuerySimple(fiwareIPAddr, fiwareEntityType, fiwareControllerCallback);
};

exports.executeSubscriptionEntity = function (count, fiwareDeviceInfo, fiwareControllerCallback) {
    iterationEntitySubscription(count, fiwareDeviceInfo, fiwareControllerCallback);
};

exports.executeUnsubscriptionEntity = function (subscriptionIDArray, fiwareControllerCallback) {
    iterationEntityUnsubscription(subscriptionIDArray, fiwareControllerCallback);
};