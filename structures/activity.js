const trace = require('debug')('soundcloud-rp:trace');
const WAIT_BEFORE_CLEAR = 15;

module.exports = (config, rpc) => {

  const soundcloud = require('./soundcloud.js')(config);

  let LOCKED = false;

  return (request_data) => {
    trace('activity', request_data);

    return new Promise((resolve, reject) => {

    if (!('url' in request_data) || !('pos' in request_data)) {
      console.log("Bad Request, missing arguments");
      reject(new Error('Missing url/pos argument.'));
      return;
    }

    if (!rpc.status) {
      console.log("Service Unavailable, rpc not connected");
      reject(new Error('RPC not connected to Discord.'));
      return;
    }

    if (LOCKED) {
      console.log("LOCKED state, we are already updating activity");
      reject(new Error('An activity request is already being processed.'));
      return;
    }

    function success() {
      LOCKED = false;
      resolve();
    }

    function error(err) {
      LOCKED = false;
      reject(err);
    }

    try {
      LOCKED = true;

      let last_activity = rpc.getActivity();
      if (last_activity && last_activity.trackURL == request_data.url) {
      // console.log('track info already sent, updating timestamps only...');

        last_activity.startTimestamp = Math.round(new Date().getTime() / 1000) - request_data.pos;
        last_activity.endTimestamp = last_activity.startTimestamp + Math.round(last_activity.trackDuration / 1000);

        rpc.setActivity(last_activity).then(() => {
          rpc.setActivityTimeout(last_activity.endTimestamp + WAIT_BEFORE_CLEAR);
          success();
        }).catch(error);

        return;
      }

      console.log("getting track info...");

      soundcloud.getTrackData(request_data.url).then((track_data) => {
      console.log("Getting track info successfully.", track_data.id);

      let startTimestamp = Math.round(new Date().getTime() / 1000) - request_data.pos, endTimestamp = startTimestamp + Math.round(track_data.duration / 1000);

      let activity_data = {
        details: track_data.title,
        state: `by ${track_data.user.username}`,
        startTimestamp,
        endTimestamp,
        largeImageKey: track_data.artwork_url ?? 'https://imgur.com/a/T3Bp7nq',
        largeImageText: track_data.title,
        smallImageKey: "https://i.imgur.com/kL9JNVF.png",
        smallImageText: track_data.user.username,
        trackURL: request_data.url,
        trackDuration: track_data.duration,
        buttons: [
          { 
            label: '☁ Play on Soundcloud',
            url: track_data.permalink_url 
          },
        ]
      };

      console.log("Everything ok, updating activity.", activity_data);

        rpc.setActivity(activity_data).then(() => {
          rpc.setActivityTimeout(endTimestamp + WAIT_BEFORE_CLEAR);
          success();
        }).catch(error);
      }).catch(error);
      
      } catch(err) {
        console.log(err);
      }
    });

  }
}

