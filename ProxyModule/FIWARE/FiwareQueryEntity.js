/**
 * Created by JaeYoungHwang on 2017-03-03.
 * forest62590@gmail.com
 */

var requestToAnotherServer = require('request');

var gettingDeviceInfo = function (EntityName, EntityType, fiwareCallback) {

    var targetURL = fiwareIP + '/v2/entities/' + EntityName + '/' + 'attrs' + '?' + 'type=' + EntityType;

    console.log("FIWARE Query Target URL :" + targetURL);

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

            if (statusCode == 200) { // request retrieve success
                var deviceAttrData = JSON.parse(fiwareResponse.body);
                var attrKeys = Object.keys(deviceAttrData);

                // Adding Fiware mandatory information
                var resultObject = new Object();
                resultObject.entityName = EntityName;
                resultObject.entityType = EntityType;

                // Adding fiware device parameters respectively
                for(var i = 0; i < attrKeys.length; i++) {

                    // Getting metadata information from attributes
                    var metadata = deviceAttrData[attrKeys[i]].metadata;

                    if(metadata) { // If metadata exist...
                        var metadataKey = Object.keys(metadata);
                        var metadataLength = metadataKey.length;
                        var metadataSet = new Object();

                        for(var j = 0; j < metadataLength; j++) {
                            metadataSet[metadataKey[j]] = metadata[metadataKey[j]].value;
                        }

                        // Adding attribute value and metadataSet
                        var attributeTypeValues = new Object();
                        attributeTypeValues.value =  deviceAttrData[attrKeys[i]].value;
                        attributeTypeValues.type = deviceAttrData[attrKeys[i]].type;
                        attributeTypeValues.metadata = metadataSet;

                        // Make attribute by Merging attribute value and metadataSet
                        resultObject[attrKeys[i]] = attributeTypeValues;

                    } else { // If not...
                        var attributeTypeValues = new Object();
                        attributeTypeValues.value =  deviceAttrData[attrKeys[i]].value;
                        attributeTypeValues.type = deviceAttrData[attrKeys[i]].type;

                        resultObject[attrKeys[i]] = attributeTypeValues;
                    }
                }
                console.log(JSON.stringify(resultObject));
                fiwareCallback(statusCode, resultObject); // Callback method for sending QueryEntity result to FiwareController
            } else if (statusCode == 404) { // resource not found
                fiwareCallback(statusCode, null);
            } // Status code will be added later
        } else { // For example, Request Timeout
            if(error.code === 'ETIMEDOUT') // request timeout
                fiwareCallback(408, null);
        }
    });
};

exports.getFiwareDevice = function(EntityName, EntityType, fiwareCallback) {
    gettingDeviceInfo(EntityName, EntityType, fiwareCallback);
};