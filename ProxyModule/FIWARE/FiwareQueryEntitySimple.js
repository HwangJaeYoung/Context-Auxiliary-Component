/**
 * Created by JaeYoungHwang on 2017-06-28.
 */

var requestToAnotherServer = require('request');

var gettingDeviceInfo = function (fiwareIPAddr, fiwareEntityType, fiwareCallback) {

    var targetURL = fiwareIPAddr + '/v2/entities' + '?' + 'type=' + fiwareEntityType + '&limit=2';

    console.log("Target URL :" + targetURL);

    // Request for getting fiware device information from ContextBroker (Query Entity)
    requestToAnotherServer( { url : targetURL,
        method : 'GET',
        strictSSL: false,
        headers : {
            'Accept' : 'application/json'
        }
    }, function (error, fiwareResponse, body) {
        if(typeof(fiwareResponse) !== 'undefined') {

            var statusCode = fiwareResponse.statusCode;

            console.log("status code : " + statusCode);

            if (statusCode == 200) { // request retrieve success
                fiwareCallback(statusCode, fiwareResponse.body);
            } else if (statusCode == 404) { // resource not found
                fiwareCallback(statusCode, null);
            } // Status code will be added later
        } else { // For example, Request Timeout
            if(error.code === 'ETIMEDOUT') // request timeout
                fiwareCallback(408, null);
        }
    });
};

exports.getFiwareDevice = function(fiwareIPAddr, fiwareEntityType, fiwareCallback) {
    gettingDeviceInfo(fiwareIPAddr, fiwareEntityType, fiwareCallback);
};