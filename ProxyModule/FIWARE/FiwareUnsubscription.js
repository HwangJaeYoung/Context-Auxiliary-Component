/**
 * Created by JaeYoungHwang on 2017-03-15.
 * forest62590@gmail.com
 */

var requestToAnotherServer = require('request');

var unsubscriptionFiwareDevice = function (subscriptionID, fiwareCallback) {

    var targetURL = fiwareIP + '/v2/subscriptions/' + subscriptionID;
    console.log("FIWARE unsubscription Target URL :" + targetURL);

    // Unsubscribing FIWARE device
    requestToAnotherServer( { url : targetURL,
        method : 'DELETE',
        strictSSL: false,
        headers : {
            'Accept' : 'application/json'
        },
    }, function (error, fiwareResponse, body) {

        if(typeof(fiwareResponse) !== 'undefined') {

            var statusCode = fiwareResponse.statusCode;

            if (statusCode == 204) { // No content
                fiwareCallback(statusCode);
            } else if (statusCode == 404) { // resource not found
                fiwareCallback(statusCode);
            } // Status code will be added later
        } else { // For example, Request Timeout
            if(error.code === 'ETIMEDOUT') // request timeout
                fiwareCallback(408);
        }
    });
};

exports.unsubFiwareDevice = function(subscriptionID, fiwareCallback) {
    unsubscriptionFiwareDevice(subscriptionID, fiwareCallback);
};