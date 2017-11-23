/**
 * Created by JaeYoungHwang on 2017-06-20.
 * forest62590@gmail.com
 */

// extract the modules
var fs = require('fs');
var async = require('async');
var express = require('express');
var bodyParser = require('body-parser');
var fiwareController = require('./ProxyModule/FiwareController');
var oneM2MController = require('./ProxyModule/oneM2MController');
var sendingNodeCount = require('./ProxyModule/MMG/PostConnectedDevice');
var statusCodeMessage = require('./ETC/StatusCode');
const crypto = require('crypto');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

global.fiwareIP = '';
global.yellowTurtleIP = '';
global.notificationURL = '';
global.MMGURL = '';
global.randomValueBase64 = function(len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
        .toString('base64')   // convert to base64 format
        .slice(0, len)        // return required number of characters
        .replace(/\+/g, '0')  // replace '+' with '0'
        .replace(/\//g, '0'); // replace '/' with '0'
};
global.connectedDeviceList = 0;

fs.readFile('conf.json', 'utf-8', function (err, data) {
    if (err) {
        console.log("FATAL An error occurred trying to read in the file: " + err);
        console.log("error : set to default for configuration");
    } else {
        var conf = JSON.parse(data)['proxy:conf'];

        // This url information will be changed by MMG manager input. if not CAG will use these url.
        fiwareIP = conf['fiwareIP'];
        yellowTurtleIP = conf['yellowTurtleIP'];
        notificationURL = conf['notificationURL'];
        MMGURL = conf['MMGURL'];

        fs.readFile('nodeCount.json', 'utf-8', function (err, data) {
            if (err) {
                console.log("FATAL An error occurred trying to read in the file: " + err);
            } else {
                var counting = JSON.parse(data)['proxy:nodeCount'];
                connectedDeviceList = counting['count'];
                serverStartFunction();

                // Optional Function (Automatically)
                // When CAG starts, It deletes all subscriptions based on subscriptionList.txt file.
                // If user don't use this function, user can delete subscription manually if they use their local server.
                /* fs.readFile('subscriptionList.txt', 'utf-8', function (err, data) {
                    if (err) {
                        console.log("FATAL An error occurred trying to read in the file: " + err);
                    } else {
                        var subIdArray = data.split("\n");

                        if(subIdArray.length > 0 && subIdArray[0] != '') {
                            console.log('Subscription Delete start....');

                            fiwareController.executeUnsubscriptionEntity(subIdArray, function (requestResult, statusCode) {

                                if(requestResult) { // success (true)
                                    fs.writeFile('subscriptionList.txt', '', function (err) {
                                        if (err)
                                            console.log('FATAL An error occurred trying to write in the file: ' + err);
                                        else {
                                            serverStartFunction();
                                        }
                                    });
                                } else { // fail (false)
                                    console.log(statusCodeMessage.statusCodeGenerator(statusCode) + '\n');
                                    console.log('Please restart server...');
                                }
                            });
                        } else {
                            serverStartFunction();
                        }
                    }
                }); */
            }
        });
    }
});

// Device information from MMG management system
app.post('/MMGDeviceInfoEndpoint', function(request, response) {

    var selectedDevices = request.body['FiwareDevices']; // Root
    var deviceInfo = selectedDevices.deviceInfo;
    var deviceCount = Object.keys(deviceInfo).length;

    // Changing ContextBrokerIP, oneM2M ServerIP, notificationURL
    if(selectedDevices.fiwareIPAddr)
        fiwareIP = selectedDevices.fiwareIPAddr;

    if(selectedDevices.mobiusServerIPAddr)
        yellowTurtleIP = selectedDevices.mobiusServerIPAddr;

    if(selectedDevices.notificationIPAddr) {
        notificationURL = selectedDevices.notificationIPAddr;
        notificationURL += "/FiwareNotificationEndpoint";
    }

    var fiwareDeviceInfo = new Entity( ); // Device information container

    // get entity name and entity type for executing QueryEntity
    for(var i = 0; i < deviceCount; i++) {
        fiwareDeviceInfo.setEntityName(deviceInfo[Object.keys(deviceInfo)[i]].entityName);
        fiwareDeviceInfo.setEntityType(deviceInfo[Object.keys(deviceInfo)[i]].entityType);
    }

    async.waterfall([
        // Get Fiware device information
        function(callbackForOneM2M){
            fiwareController.executeQueryEntity(fiwareDeviceInfo, function (requestResult, statusCode, detailFiwareDeviceInfo) {
                if (requestResult) { // success (true)
                    callbackForOneM2M(null, detailFiwareDeviceInfo);
                } else { // fail (false)
                    callbackForOneM2M(statusCode, null);
                }
            });
        }, // Fiware resource retrieve

        /**************************************
         * When these procedures are finished perfectly; AE → Container → contentInstance → Subscription (to FIWARE)
         * CAG will show the success messages. if not it will show error messages.
         */

        // oneM2M Resource registration and subscription of device from FIWARE
        function(detailFiwareDeviceInfo, resultCallback) {

            var count = 0;
            var selectedDevices = detailFiwareDeviceInfo['FiwareDevices']; // Root
            var deviceInfo = selectedDevices.deviceInfo;
            var deviceLists = Object.keys(deviceInfo).length;

            async.whilst(
                function () {
                    return count < deviceLists;
                },
                function (async_for_loop_callback) {

                    async.waterfall([
                        // Spot container registration
                        function(CallbackForContainerRegistration){
                            oneM2MController.registrationContainer(count, detailFiwareDeviceInfo, function (requestResult, statusCode) {
                                if(requestResult) { // Spot container registration success
                                    CallbackForContainerRegistration(null, detailFiwareDeviceInfo);
                                } else { // Spot container registration fail
                                    CallbackForContainerRegistration(statusCode, null);
                                }
                            });
                        },

                        // Container: status, info / contentInstance: status, info registration
                        function(detailFiwareDeviceInfo, CallbackForConCinRegistration) {
                            oneM2MController.registrationConCin(count, detailFiwareDeviceInfo, function (requestResult, statusCode) {
                                if(requestResult) {
                                    CallbackForConCinRegistration(null, detailFiwareDeviceInfo);
                                } else {
                                    CallbackForConCinRegistration(statusCode, null);
                                }
                            });
                        },

                        // Subscribing the device registered in ContextBroker
                        function(detailFiwareDeviceInfo, CallbackForSubscriptionRegistration) {

                            fiwareController.executeSubscriptionEntity(count, detailFiwareDeviceInfo, function (requestResult, statusCode, subscriptionID) {
                                if(requestResult) { // Subscription Registration success

                                    connectedDeviceList++;

                                    var rootObject = new Object();
                                    var countObject = new Object();
                                    countObject["count"] = connectedDeviceList;
                                    rootObject['proxy:nodeCount'] = countObject;

                                    fs.writeFile('nodeCount.json', JSON.stringify(rootObject), function (err) {
                                        if (err)
                                            console.log('FATAL An error occurred trying to write in the file: ' + err);
                                        else
                                            console.log('nodeCount is stored in nodeCount.json');
                                    });

                                    // Storing the subscription IDs that is used for distinct the subscription
                                    fs.appendFile('subscriptionList.txt', subscriptionID, function (err) {
                                        if (err)
                                            console.log('FATAL An error occurred trying to write in the file: ' + err);
                                        else
                                            console.log('SubscriptionID is stored in subscriptionList.txt');
                                    });
                                    CallbackForSubscriptionRegistration(null);
                                } else { // Subscription Registration fail
                                    CallbackForSubscriptionRegistration(statusCode, null);
                                }
                            })
                        }
                    ], function (statusCode, result) { // response to client such as web or postman
                        if(statusCode) { // Container → contentInstance → Subscription (fail)
                            // Generally, '409' means error. But CAG handles this error as success message in this code.
                            if(statusCode == 409) { // Resource Registration Conflict
                                count++; async_for_loop_callback();
                            } else {
                                async_for_loop_callback(statusCode); // fail
                            }
                        } else { // Container → contentInstance → Subscription (success)
                            count++; async_for_loop_callback();
                        }
                    }); // async.waterfall
                },
                function (statusCode, n) {
                    if(statusCode) {
                        resultCallback(statusCode); // fail
                    } else {
                        resultCallback(201); // resource registration ssuccess
                    }
                }
            );
        } // oneM2M Registration function
    ], function (statusCode, result) { // response to client such as web or postman
        console.log(statusCodeMessage.statusCodeGenerator((statusCode)));

        // This function is implemented for sending device count to MMG Manager
        /*if(statusCode == 201) {
            sendingNodeCount.FIWARENodeCountExecution(connectedDeviceList, function (statusCode) {
                response.status(statusCode).send(statusCodeMessage.statusCodeGenerator(statusCode));
            });
        }*/

        response.status(statusCode).send(statusCodeMessage.statusCodeGenerator(statusCode));
    });
});

// Getting FIWARE device list, This function is executed by MMG manager.
app.post('/getFiwareDeviceList', function (request, response) {

    var fiwareQueryInfo = request.body['FiwareQueryInfo']; // Root
    var fiwareIPAddr = fiwareQueryInfo.fiwareIPAddr;
    var queryTypeofFIWARE = fiwareQueryInfo.selectedEntityType;

    fiwareController.executeQueryEntitySimple(fiwareIPAddr, queryTypeofFIWARE, function (requestResult, statusCode, responseObject) {
        if (requestResult) { // success (true)
            response.status(statusCode).send(responseObject);
        } else { // fail (false)
            response.status(statusCode).send(statusCodeMessage.statusCodeGenerator(statusCode));
        }
    });
});

// Fiware Subscription endpoint
app.post('/FiwareNotificationEndpoint', function(request, response) {

    console.log("Receiving notification messages from FIWARE");
    console.log(JSON.stringify(request.body));

    oneM2MController.updateFiwareToOneM2M(request.body, function (requestResult, statusCode) {
        // In this function, CAG needn't show the status code on the web page.
        console.log(statusCodeMessage.statusCodeGenerator(statusCode));
    });
});

// Server testing code
app.get('/', function (request, response) {
    response.send('<h1>'+ 'Context-Aware auxiliary component' + '</h1>');
});

// Creating Server object
var serverStartFunction = function( ) {
    // Server start!!
    app.listen(62590, function () {
        console.log('Server running at http://localhost:62590');
    });
};

// FIWARE Entity Container
function Entity( ) {
    // Pair Value
    this.entityName = []; // Mandatory field
    this.entityType = []; // Mandatory field

    this.setEntityName = function(entityName) {
        this.entityName.push(entityName);
    };

    this.getEntityName = function(selectedIndex) {
        return this.entityName[selectedIndex];
    };

    this.setEntityType = function (entityType) {
        this.entityType.push(entityType);
    };

    this.getEntityType = function(selectedIndex) {
        return this.entityType[selectedIndex];
    };

    this.getDeviceNumber = function ( ) {
        return this.entityName.length;
    }
}