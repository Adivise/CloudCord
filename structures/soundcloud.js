const request = require('request-promise-native');
const trace = require('debug')('soundcloud-rp:trace');

module.exports = (config) => {

function getTrackData(url) {
  trace('soundcloud.getTrackData', url);
  
  return request.get('https://api-v2.soundcloud.com/resolve', {
    qs: { 
      client_id: config.soundcloud.ClientID, 
      url
      }, json: true
    });
}
  return { getTrackData };
}