/**
 * Created by JaeYoungHwang on 2017-02-28.
 * forest62590@gmail.com
 */

// extract the modules
var async = require('async');
var containerRegistration = require('./oneM2M/ContainerRegistration');
var contentInstanceRegistration = require('./oneM2M/contentInsatnceRegistration');

var executeRegistrationContainer = function(count, fiwareInformation, oneM2MControllerCallback){

    var selectedDevices = fiwareInformation['FiwareDevices']; // Root
    var deviceInfo = selectedDevices.deviceInfo;

    // Creating AE name using Entity Name and Entity Type.
    var parkingSpotContainerName = deviceInfo[Object.keys(deviceInfo)[count]].entityName;

    var parkingSpotContainerName = parkingSpotContainerName.replace(/:/g, ".");

   containerRegistration.ContainerRegistrationExecution(parkingSpotContainerName, null, function (statusCode) {
        if(statusCode == 201)
            oneM2MControllerCallback(true, statusCode);
        else
            oneM2MControllerCallback(false, statusCode);
    })
};

var executeRegistrationConCin = function(count, fiwareInformation, oneM2MControllerCallback) {

    var selectedDevices = fiwareInformation['FiwareDevices']; // Root
    var deviceInfo = selectedDevices.deviceInfo;
    var deviceKey = [Object.keys(deviceInfo)[count]]; // device1, device2, ... , deviceN
    var device = deviceInfo[deviceKey];

    var parkingSpotContainerName = deviceInfo[Object.keys(deviceInfo)[count]].entityName;

    parkingSpotContainerName = parkingSpotContainerName.replace(/:/g, ".");

    async.waterfall([
        // status container registration (Fixed container name: status)
        function(CallbackForContainerRegistration){
            containerRegistration.ContainerRegistrationExecution(parkingSpotContainerName, 'status', function (statusCode) {
                if(statusCode == 201) // Resource creation success
                    CallbackForContainerRegistration(null);
                else // fail
                    CallbackForContainerRegistration(statusCode, null);
            });
        },

        // info container registration (Fixed container name: info)
        // In this container, all relevant information is stored such as id, type, location and so on.
        function(CallbackForContainerRegistration) {
            containerRegistration.ContainerRegistrationExecution(parkingSpotContainerName, 'info', function (statusCode) {
                if(statusCode == 201) // Resource creation success
                    CallbackForContainerRegistration(null);
                else // fail
                    CallbackForContainerRegistration(statusCode, null);
            });
        },

        // contentsInstance registration for info container
        function(CallbackForConCinRegistration) {
            contentInstanceRegistration.contentInstanceRegistrationExecution(parkingSpotContainerName, 'info', device, function (statusCode) {
                if(statusCode == 201) // Resource creation success
                    CallbackForConCinRegistration(null);
                else // fail
                    CallbackForConCinRegistration(statusCode, null);
                }
            )
        },

        // contentsInstance registration for spot container
        function (CallbackForConCinRegistration) {
            contentInstanceRegistration.contentInstanceRegistrationExecution(parkingSpotContainerName, 'status', device, function (statusCode) {
                    if(statusCode == 201) // Resource creation success
                        CallbackForConCinRegistration(null);
                    else // fail
                        CallbackForConCinRegistration(statusCode, null);
                }
            )
        }
    ], function (statusCode, result) { // response to client such as web or postman
        if (statusCode) {
            oneM2MControllerCallback(false, statusCode);
        } else {
            console.log("oneM2M resource registration is finished");
            oneM2MControllerCallback(true, statusCode);
        }
    }); // async.waterfall
};

var fiwareDeviceUpdateForOneM2M = function(fiwareInformation, oneM2MControllerCallback) {

    var attributeOrigin = fiwareInformation['data'][0]; // Root
    var parkingSpotContainerName = attributeOrigin.id;

    parkingSpotContainerName = parkingSpotContainerName.replace(/:/g, ".");

    async.waterfall([

        // contentsInstance registration for info container
        function(CallbackForConCinRegistration) {
            contentInstanceRegistration.contentInstanceRegistrationExecution(parkingSpotContainerName, 'info', attributeOrigin, function (statusCode) {
                    if(statusCode == 201) // Resource creation success
                        CallbackForConCinRegistration(null);
                    else // fail
                        CallbackForConCinRegistration(statusCode, null);
                }
            )
        },

        // contentsInstance registration for spot container
        function (CallbackForConCinRegistration) {
            contentInstanceRegistration.contentInstanceRegistrationExecution(parkingSpotContainerName, 'status', attributeOrigin, function (statusCode) {
                    if(statusCode == 201) // Resource creation success
                        CallbackForConCinRegistration(null);
                    else // fail
                        CallbackForConCinRegistration(statusCode, null);
                }
            )
        }
    ], function (statusCode, result) { // response to client such as web or postman
        if (statusCode) { // fail
            oneM2MControllerCallback(false, statusCode);
        } else {
            console.log("oneM2M resource update is finished");
            oneM2MControllerCallback(true, '201'); // success
        }
    }); // async.waterfall
};

exports.registrationContainer = function(count, fiwareInformation, oneM2MControllerCallback) {
    executeRegistrationContainer(count, fiwareInformation, oneM2MControllerCallback);
};

exports.registrationConCin = function (count, fiwareInformation, oneM2MControllerCallback) {
    executeRegistrationConCin(count, fiwareInformation, oneM2MControllerCallback);
};

exports.updateFiwareToOneM2M = function (fiwareInformation, oneM2MControllerCallback) {
    fiwareDeviceUpdateForOneM2M(fiwareInformation, oneM2MControllerCallback);
};