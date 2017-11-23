/**
 * Created by JaeYoungHwang on 2017-03-03.
 * forest62590@gmail.com
 */

var requestToAnotherServer = require('request');
var bodyGenerator = require('../Domain/BodyGenerator');

var RegistrationExecution = function (containerName, subContainerName, callBackForResponse) {

    var targetURL = '', bodyObject = null;

    if(subContainerName) { // Double Container format
        targetURL = yellowTurtleIP + '/Mobius/iotParking/parkingSpot/'  + containerName;
        bodyObject = bodyGenerator.ContainerBodyGenerator(subContainerName);
    } else { // General Container format
        targetURL = yellowTurtleIP + '/Mobius/iotParking/parkingSpot';
        bodyObject = bodyGenerator.ContainerBodyGenerator(containerName);
    }

    console.log("Container registration Target URL :" + targetURL);

    requestToAnotherServer({
        url: targetURL,
        method: 'POST',
        json: true,
        headers: { // Basic AE resource structure for registration
            'Accept': 'application/json',
            'X-M2M-RI': '12345',
            'X-M2M-Origin': 'Origin',
            'Content-Type': 'application/json;ty=3'
        },
        body: bodyObject
    }, function (error, oneM2MResponse, body) {
        if(typeof(oneM2MResponse) !== 'undefined') {

            var statusCode = oneM2MResponse.statusCode;

            if (statusCode == 201) { // resource creation success
                callBackForResponse(statusCode);
            } else if(statusCode == 400) { // bad request
                callBackForResponse(statusCode);
            } else if (statusCode == 409) { // resource conflict error
                callBackForResponse(statusCode);
            } // Status code will be added later
        } else { // For example, Request Timeout
            if(error.code === 'ETIMEDOUT') // request timeout
                callBackForResponse(408);
        }
    });
};

exports.ContainerRegistrationExecution = function(containerName, subContainerName, callBackForResponse) {
    RegistrationExecution(containerName, subContainerName, callBackForResponse);
};