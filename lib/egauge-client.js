const fetch = require('node-fetch');
const md5 = require('md5');

class EgaugeClient {
  constructor({ host, username, password }) {
    this.host = host;
    this.username = username;
    this.password = password;
    this.token = null;
    this.tokenExpires = 0;
  }

  async _authenticate() {
    const now = Date.now();
    if (this.token && now < this.tokenExpires - 30000) return; // 30s before expiry

    const url = `http://${this.host}/json/auth`; // placeholder
    const res1 = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (res1.status !== 401) throw new Error('Unexpected auth response');
    const authHeader = res1.headers.get('www-authenticate');
    const nonce = /nonce="([^"]+)"/.exec(authHeader)[1];
    const realm = /realm="([^"]+)"/.exec(authHeader)[1];
    const cnonce = md5(Math.random().toString());
    const ha1 = md5(`${this.username}:${realm}:${this.password}`);
    const ha2 = md5(`GET:/json/token`);
    const response = md5(`${ha1}:${nonce}:00000001:${cnonce}:auth:${ha2}`);
    const auth = `Digest username="${this.username}", realm="${realm}", nonce="${nonce}", uri="/json/token", algorithm=MD5, response="${response}", qop=auth, nc=00000001, cnonce="${cnonce}"`;
    const res2 = await fetch(`http://${this.host}/json/token`, {
      headers: {
        'Authorization': auth,
        'Accept': 'application/json'
      }
    });
    if (!res2.ok) throw new Error('Token request failed');
    const data = await res2.json();
    this.token = data.token;
    this.tokenExpires = now + data.expires * 1000;
  }

  async _get(path) {
    await this._authenticate();
    const res = await fetch(`http://${this.host}${path}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    if (!res.ok) throw new Error('eGauge request failed');
    return res.json();
  }

  async getCurrentPower() {
    const data = await this._get('/api/register?rate');
    let total = 0;
    if (data.registers) {
      for (const r of data.registers) {
        if (r.watts != null) total += r.watts;
      }
    }
    return total / 1000; // kW
  }

  async proxy(path) {
    return this._get(path);
  }
}

module.exports = EgaugeClient;
