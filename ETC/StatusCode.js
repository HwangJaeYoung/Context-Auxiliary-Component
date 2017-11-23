/**
 * Created by JaeYoungHwang on 2017-03-29.
 * forest62590@gmail.com
 */

// We can enhance these status code by adding error messages from server.
// For example, var getStatusCodeMessage = function (statusCode, errorMessages) { ... }

var getStatusCodeMessage = function(statusCode) {
    if(statusCode == 200) {
        return "Resource retrieving success";
    } else if (statusCode == 201) {
        return "Resource creating success";
    } else if (statusCode == 400) {
        return "Bad Request";
    } else if(statusCode == 404) {
        return "Server can't find resource";
    } else if(statusCode == 409) {
        return "Resource is conflicted";
    } else if(statusCode == 408) {
        return "Request Timeout";
    }
};

exports.statusCodeGenerator = function (statusCode) {
    return getStatusCodeMessage(statusCode);
};