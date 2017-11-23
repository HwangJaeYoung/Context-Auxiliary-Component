/**
 * Created by JaeYoungHwang on 2017-03-08.
 * forest62590@gmail.com
 */

var AEBodyGeneration = function (AEName) {
    var bodyObject = new Object();

    var rootForAttr = new Object();
    rootForAttr['api'] = "0.2.481.2.0001.001.000111";
    rootForAttr['rr'] = "true";
    rootForAttr['rn'] = AEName;
    bodyObject['m2m:ae'] = rootForAttr;

    return bodyObject;
};

var ContainerBodyGeneration = function (ContainerName) {
    var bodyObject = new Object();

    var rootForAttr = new Object();
    rootForAttr['rn'] = ContainerName;
    bodyObject['m2m:cnt'] = rootForAttr;

    return bodyObject;
};

var contentInstanceBodyGeneration = function (device) {
    var bodyObject = new Object();
    var rootForAttr = new Object();

    rootForAttr['con'] =  device['status'].value;
    bodyObject['m2m:cin'] = rootForAttr;

    return bodyObject;
};

var subscriptionBodyGenerator = function (device) {
    var bodyObject = new Object();
    var attributeKey = Object.keys(device);
    var attributeCount = attributeKey.length;

    // Description
    bodyObject['description'] = "Fiware Device Subscription for oneM2M";

    /****************** Subject object generation ******************/
        // Subject Root
    var subjectObjectsRoot = new Object();
    var entitiesArray = new Array();

    // Subject entities
    var entity = new Object();
    entity['id'] = device.entityName;
    entity['type'] = device.entityType;
    entitiesArray.push(entity);

    // Subject condition
    var condition = new Object();
    var conditionArray = new Array();

    for(var i = 0; i < attributeCount; i++) {
        if ((attributeKey[i] == 'entityName' || attributeKey[i] == 'entityType') == false)
            conditionArray.push(attributeKey[i]);
    }
    condition['attr'] = conditionArray;

    // Merging subject information
    subjectObjectsRoot['entities'] = entitiesArray;
    subjectObjectsRoot['condition'] = condition;
    bodyObject['subject'] = subjectObjectsRoot;

    /****************** Notification object generation ******************/
        // Making notification information
    var notification = new Object();

    // Notification http
    var urlObject = new Object();
    urlObject['url'] = notificationURL;
    notification['http'] = urlObject;

    // Notification attrs
    var attributeArray = new Array();
    for(var i = 0; i < attributeCount; i++) {
        if ((attributeKey[i] == 'entityName' || attributeKey[i] == 'entityType') == false)
            attributeArray.push(attributeKey[i]);
    }

    // Merging notification information
    notification['attrs'] = attributeArray;
    bodyObject['notification'] = notification;

    /****************** Expires & Throttling ******************/
    bodyObject['expires'] = "2040-01-01T14:00:00.00Z"; // We can omit 'expires' attribute then it will be permanently
    bodyObject['throttling'] = 5;

    return bodyObject;
};

/*************************************************************************************
    * contentInstanceBodyGenerationForJSON function will generate body form as follows.
    {
        "id": "busan.parkingSpot.sensor522",
        "type": "ParkingSpot",
        "name": "sensor522",
        "location": {
	        "type": "Point",
	        "coordinates": [35.17, 129.17]
        },
        "refParkingSite": "busan.offStreetParking.jwadongmunhwawon",
        "category": ["offstreet"]
    }
 **************************************************************************************/

var contentInstanceBodyGenerationForJSON = function (device) {

    // Getting device attributes such as id, type, location and so on.
    var attributeKey = Object.keys(device);
    var attributeCount = attributeKey.length;

    // Root JSON Object
    var bodyObject = new Object();

    for(var attrCount = 0; attrCount < attributeCount; attrCount++) {

        if (attributeKey[attrCount] == "dateModified" || attributeKey[attrCount] == "status")
            continue;

        var findingLocationType = device[attributeKey[attrCount]].type;

        if(findingLocationType == 'geo:json') {
            bodyObject[attributeKey[attrCount]] = device[attributeKey[attrCount]].value;
        } else if (attributeKey[attrCount] == "entityName" || attributeKey[attrCount] == "entityType") {
            if(attributeKey[attrCount] == "entityName")
                bodyObject["id"] = device['entityName'].replace(/:/g, ".");
            else if (attributeKey[attrCount] == "entityType")
                bodyObject["type"] = device['entityType'];
        } else if (attributeKey[attrCount] == "id" || attributeKey[attrCount] == "type") {
            if(attributeKey[attrCount] == "id")
                bodyObject[attributeKey[attrCount]] = device['id'].replace(/:/g, ".");
            else if (attributeKey[attrCount] == "type")
                bodyObject[attributeKey[attrCount]] = device['type'];
        } else if (attributeKey[attrCount] == "refParkingSite") { // Temporary hardcoded source.
            bodyObject[attributeKey[attrCount]] = "Santander_downtown";
        } else {
            bodyObject[attributeKey[attrCount]] = device[attributeKey[attrCount]].value;
        }
    }

    var rootForAttr = new Object();
    var contentObject = new Object();

    contentObject['con'] = bodyObject;
    rootForAttr['m2m:cin'] = contentObject;

    return rootForAttr;
};

var generatingNodeCountBody = function (nodeCount) {
    var bodyObject = new Object();

    var nodeCountObject = new Object();
    nodeCountObject['managedFiwareDevices'] = nodeCount;
    bodyObject['FiwareManagedInfo'] = nodeCountObject;

    return bodyObject;
};

// oneM2M Body Generator
exports.AEBodyGenerator = function(AEName) {
    return AEBodyGeneration(AEName);
};

exports.ContainerBodyGenerator = function(containerName) {
    return ContainerBodyGeneration(containerName);
};

exports.contentInstanceBodyGenerator = function(contentInstanceName, contentInstanceValue) {
    return contentInstanceBodyGeneration(contentInstanceName, contentInstanceValue);
};

exports.contentInstanceBodyGeneratorForJSON = function (device) {
    return contentInstanceBodyGenerationForJSON(device);
};

exports.simpleContentInstanceBodyGeneratorForJSON = function (device) {
    return contentInstanceBodyGenerationForJSON(device);
};

// FIWARE Body Generator
exports.fiwareSubscriptionBodyGenerator = function (device) {
    return subscriptionBodyGenerator(device);
};

// Node count Body Generator
exports.nodeCountBodyGenerator = function (nodeCount) {
    return generatingNodeCountBody(nodeCount);
};