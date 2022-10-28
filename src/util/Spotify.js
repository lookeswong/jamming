const clientID = process.env.REACT_APP_API_KEY;
// const redirectURI = 'http://localhost:3000/';
const redirectURI = 'http://lucas-jam.surge.sh';
let accessToken;

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }

    // check for access token match
    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
    // console.log("accessToken", accessTokenMatch);
    // console.log("expiresIn", expiresInMatch);

    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]);
      // clear the parameters to grabb a new access token when it expires
      window.setTimeout(() => accessToken = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/');
      console.log("accessToken yes");
      return accessToken;
    } else {
      console.log("no token");
      const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
      window.location = accessUrl;
    }
  },

  search(term) {
    const accessToken = Spotify.getAccessToken();
    console.log(accessToken);
    console.log('search token got it')
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, { 
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then(response => response.json()
    ).then(jsonResponse => {
      if (!jsonResponse.tracks) {
        return [];
      }
      console.log(jsonResponse);
      return jsonResponse.tracks.items.map(track => (
        {
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          uri: track.uri
        }
      ));
    });
  },

  savePlaylist(name, trackURIs) {
    if (!name || !trackURIs.length) {
      return;
    }

    const accessToken = Spotify.getAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}`};
    let userId;

    return fetch('https://api.spotify.com/v1/me', {headers: headers}
    ).then(response => response.json()
    ).then(jsonResponse => {
      userId = jsonResponse.id
      return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, 
      {
        headers: headers,
        method: 'POST',
        body: JSON.stringify({ name: name })
      }).then(response => response.json()
      ).then(jsonResponse => {
        const playlistId = jsonResponse.id;
        return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
          headers: headers,
          method: 'POST',
          body: JSON.stringify({ uris: trackURIs})
        })
      })
    })
  }

}


export default Spotify;