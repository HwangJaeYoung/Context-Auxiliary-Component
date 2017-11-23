/**
 * Created by JaeYoungHwang on 2017-03-03.
 * forest62590@gmail.com
 */

var requestToAnotherServer = require('request');
var bodyGenerator = require('../Domain/BodyGenerator');

// This function is used for sending device count to MMG manager.
var sendingFIWARENodeCount = function (fiwareNodeCount, callBackForResponse) {

    var targetURL = MMGURL, bodyObject = null;
    console.log("Target URL :" + targetURL);

    bodyObject = bodyGenerator.nodeCountBodyGenerator(fiwareNodeCount);

    requestToAnotherServer({
        url: targetURL,
        method: 'POST',
        json: true,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: bodyObject
    }, function (error, nodeCountResponse, body) {
        if(typeof(nodeCountResponse) !== 'undefined') {

            var statusCode = nodeCountResponse.statusCode;

            if (statusCode == 200) { // success
                callBackForResponse(statusCode); // Callback method for sending QueryEntity result to FiwareController
            } else if(statusCode == 400) { // bad request
                callBackForResponse(statusCode);
            } // Status code will be added later
        } else { // For example, Request Timeout
            if(error.code === 'ETIMEDOUT') // request timeout
                callBackForResponse(408);
        }
    });
};

exports.FIWARENodeCountExecution = function(fiwareNodeCount, callBackForResponse) {
    sendingFIWARENodeCount(fiwareNodeCount, callBackForResponse);
};
