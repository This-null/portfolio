const LANYARD_WS = 'wss://api.lanyard.rest/socket';
const LANYARD_OP = {
  PRESENCE: 0,
  HELLO: 1,
  INITIALIZE: 2,
  HEARTBEAT: 3,
};
const EVENTS_TO_CALLBACK = ['INIT_STATE', 'PRESENCE_UPDATE'];
const DISCORD_ID = '769979665224958020';

let currentTimer = null;

async function initializeSocket() {
  let ws = new WebSocket(LANYARD_WS);

  ws.onmessage = ({ data }) => {
    const received = JSON.parse(data);

    switch (received.op) {
      case LANYARD_OP.HELLO: {
        ws.send(JSON.stringify({ op: LANYARD_OP.INITIALIZE, d: { subscribe_to_id: DISCORD_ID } }));

        setInterval(() => {
          ws.send(JSON.stringify({ op: LANYARD_OP.HEARTBEAT }));
        }, 1000 * 30);
      }

      case LANYARD_OP.PRESENCE: {
        if (EVENTS_TO_CALLBACK.includes(received.t)) {
          setPresence(received.d);
        }
      }
    }
  };

  ws.onclose = () => initializeSocket;
}

async function setAvatar({ discord_user }) {
  var fullUrl = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${discord_user.avatar}`;

  document.getElementById('pfp').src = fullUrl;
}

async function setAvatarFrame({ discord_status }) {
  const activity2 = document.getElementById('status2');

  if (discord_status == 'offline') {
    activity2.innerHTML = "Çevrimdışı";
    activity2.style.cssText = 'color: unset; opacity: 0.5;';
  } else {
    activity2.innerHTML = "Çevrimiçi";
    activity2.style.cssText = 'color: #3ba45d; opacity: 1;';
  }
  switch (discord_status) {
    case 'online':
      document.getElementById('activity-dot').style.background = '#3ba45d';
      document.getElementById('activity-dot').title = 'Online';
      break;

    case 'dnd':
      document.getElementById('activity-dot').style.background = '#ed4245';
      document.getElementById('activity-dot').title = 'Do not disturb';
      break;

    case 'idle':
      document.getElementById('activity-dot').style.background = '#faa81a';
      document.getElementById('activity-dot').title = 'Idle';
      break;

    case 'offline':
      document.getElementById('activity-dot').style.background = '#747e8c';
      document.getElementById('activity-dot').title = 'Offline';
      break;
  }
}

async function setUsername({ discord_user }) {
  var { username, discriminator } = discord_user;
  var fullName = `${username}#${discriminator}`;

  document.getElementById('username').innerHTML = fullName;
}

async function setStatus({ discord_status, activities }) {
  if (discord_status == 'offline') {
    return;
  }

  var status = activities[0].state;
  if (!status) {
    return;
  }

  document.getElementById('status').innerHTML = `Status: "${status}"`;
}

async function setSpotifyBar({ listening_to_spotify, spotify }) {
  if (currentTimer) clearInterval(currentTimer);

  var bar = document.getElementById('spotify-innerbar');
  var bar2 = document.getElementById('spotify-time-end');
  var bar3 = document.getElementById('spotify-time-start');

  if (listening_to_spotify == false) {
    bar.style.display = 'none';
    bar2.innerHTML = '00:00';
    bar3.innerHTML = '00:00';
    return;
  }

  const end = spotify.timestamps.end;
  const start = spotify.timestamps.start;

  let duration = end - start;

  function spotifyTimeSet(date, element) {
    const x = document.getElementById(element);
    const y = new Date(date);

    const minutes = y.getMinutes();
    const seconds = y.getSeconds();
    const formmatedseconds = seconds < 10 ? `0${seconds}` : seconds;
    x.innerHTML = `${minutes}:${formmatedseconds}`;
  }

  spotifyTimeSet(duration, 'spotify-time-end');

  currentTimer = setInterval(() => {
    const date = new Date().getTime();
    let current = date - start;

    spotifyTimeSet(current, 'spotify-time-start');

    prcnt = (current / duration) * 100;
    precentage = Math.trunc(prcnt);
    prccc = Math.round((prcnt + Number.EPSILON) * 100) / 100;
    i = 1;

    bar.style.display = 'block';
    bar.style.width = prccc + '%';
  }, 1000);
}

async function setSpotifySongName({ listening_to_spotify, spotify }) {
  var par = document.getElementById('spotify-song');

  if (listening_to_spotify == false) {
    par.innerHTML = 'Nothing is playing';
    return;
  }

  par.style.display = 'block';
  par.innerHTML = spotify.song;
}

async function setSpotifyAlbumCover({ listening_to_spotify, spotify }) {
  var par = document.getElementById('album-cover');

  if (listening_to_spotify == false) {
    par.style.display = 'none';
    return;
  }

  par.style.display = 'block';
  par.src = spotify.album_art_url;
}

async function setSpotifyArtist({ listening_to_spotify, spotify }) {
  var par = document.getElementById('spotify-artist');

  if (listening_to_spotify == false) {
    par.innerHTML = 'Nobody';
    return;
  }

  par.style.display = 'block';
  par.innerHTML = `by: ${spotify.artist}`;
}

async function setPresence(data) {
  setUsername(data);
  setStatus(data);
  setAvatarFrame(data);
  setAvatar(data);
  setSpotifyAlbumCover(data);
  setSpotifyArtist(data);
  setSpotifySongName(data);
  setSpotifyBar(data);
}

initializeSocket();
