import * as crypto from 'crypto';
import * as fetch from 'node-fetch';

export interface CardmarketParameters {
  realm: string;
  oauth_consumer_key: string;
  oauth_nonce: string;
  oauth_signature_method: string;
  oauth_timestamp: number;
  oauth_token: string;
  oauth_version: string;
}

export interface CardmarketQuery {
  queryName: string;
  queryValue: string | number;
}

export interface RestMethod {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

export class CardmarketWrapper {
  private APP_TOKEN = '';
  private APP_SECRET = '';
  private ACCESS_TOKEN = '';
  private ACCESS_TOKEN_SECRET = '';
  private CARDMARTKET_URL = 'https://api.cardmarket.com/ws/v2.0';
  private OAUTH_VERSION = '1.0';
  private SIGNATURE_METHOD = 'HMAC-SHA1';
  private _debug = false;

  constructor(appToken: string, accessToken: string, appSecret?: string, accessTokenSecret?: string) {
    if (!appToken) throw new Error('App Token cannot be empty');
    this.APP_TOKEN = appToken;
    if (!accessToken) throw new Error('Access Token cannot be empty');
    this.ACCESS_TOKEN = accessToken;
    this.APP_SECRET = appSecret || '';
    this.ACCESS_TOKEN_SECRET = accessTokenSecret || '';
  }

  /**
   * Set the debug Flag
   * @param flag
   */
  async setDebug(flag: boolean): Promise<void> {
    this._debug = flag;
  }

  async getAccountInfo() {
    const path: string = `${this.CARDMARTKET_URL}/expansions/1469/singles`;
    this.debugLog(`Requesting Account Info.\nPath is: ${path}`);
    const method: RestMethod = { method: 'GET' };
    const nonce: string = '53eb1f44909d6';
    const encodedPath = encodeURIComponent(path);
    let basePath: string = `${method}&${encodedPath}&`;
    const baseParams: CardmarketQuery[] = [
      { queryName: 'oauth_consumer_key', queryValue: this.APP_TOKEN },
      { queryName: 'oauth_nonce', queryValue: nonce },
      { queryName: 'oauth_signature_method', queryValue: 'HMAC-SHA1' },
      { queryName: 'oauth_timestamp', queryValue: Date.now() },
      { queryName: 'oauth_version', queryValue: this.APP_TOKEN },
      { queryName: 'oauth_token', queryValue: this.ACCESS_TOKEN },
    ];
    const paramString: string = await this.generateParams(baseParams);
    basePath += encodeURIComponent(paramString);
    const signingKey = `${encodeURIComponent(this.APP_SECRET)}&${encodeURIComponent(this.ACCESS_TOKEN_SECRET)}`;
    const hmac = crypto.createHmac('sha1', signingKey);
    hmac.update(basePath);
    const digest = hmac.digest('base64');
    this.debugLog(digest);
    const authProperty = `OAuth realm="${path}", oauth_version="${
      this.OAUTH_VERSION
    }", oauth_timestamp="${Date.now()}", oauth_nonce="${nonce}", oauth_consumer_key="${this.APP_TOKEN}", oauth_token="${
      this.ACCESS_TOKEN
    }", oauth_signature_method="${this.SIGNATURE_METHOD}", oauth_signature="${digest}"`;
    const res = await fetch(path, {
      method: method.method,
      headers: {
        'Content-Type': 'application/xml',
        Authorization: authProperty,
        Accept: 'application/json',
      },
      redirect: 'follow',
    });
    this.debugLog(authProperty);
    this.debugLog(res);
  }

  /*************************************Helper Functions*********************************************/

  /**
   * Log debug messages when the debug flag is set
   * @param msg The message to print
   */
  private async debugLog(msg: any): Promise<void> {
    if (this._debug) console.log(msg);
  }

  /**
   * Generate the parameter string
   * @param params The parameter array
   * @returns The parameter string
   */
  private async generateParams(params: CardmarketQuery[]): Promise<string> {
    params.sort((a, b) => {
      const keyA = a.queryName;
      const keyB = b.queryName;
      return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
    });
    let paramString = '';
    params.forEach((param) => {
      paramString += `${param.queryName}=${encodeURIComponent(param.queryValue)}&`;
    });
    return paramString.slice(0, -1);
  }
}
