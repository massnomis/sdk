import {
  Query,
  CreateQueryResp,
  QueryResultResp,
  CreateQueryJson,
  QueryResultJson,
  ApiClient,
} from "./types";
import axios, { AxiosError } from "axios";
import { UnexpectedSDKError } from "./errors";

const PARSE_ERROR_MSG =
  "the api returned an error and there was a fatal client side error parsing that error msg";

export class API implements ApiClient {
  #baseUrl: string;
  #headers: Record<string, string>;

  constructor(baseUrl: string, apiKey: string) {
    this.#baseUrl = baseUrl;
    this.#headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    };
  }

  getUrl(path: string): string {
    return `${this.#baseUrl}/${path}`;
  }

  async createQuery(query: Query): Promise<CreateQueryResp> {
    let result;
    try {
      result = await axios.post(
        this.getUrl("queries"),
        {
          sql: query.sql,
          ttl_minutes: query.ttlMinutes,
          cached: query.cached,
        },
        { headers: this.#headers }
      );
    } catch (err) {
      let errData = err as AxiosError;
      result = errData.response;
      if (!result) {
        throw new UnexpectedSDKError(PARSE_ERROR_MSG);
      }
    }

    let data: CreateQueryJson | null;
    if (result.status >= 200 && result.status < 300) {
      data = result.data;
    } else {
      data = null;
    }

    return {
      statusCode: result.status,
      statusMsg: result.statusText,
      errorMsg: data?.errors,
      data,
    };
  }

  async getQueryResult(queryID: string): Promise<QueryResultResp> {
    let result;
    try {
      result = await axios.get(this.getUrl(`queries/${queryID}`), {
        method: "GET",
        headers: this.#headers,
      });
    } catch (err) {
      let errData = err as AxiosError;
      result = errData.response;
      if (!result) {
        throw new UnexpectedSDKError(PARSE_ERROR_MSG);
      }
    }

    let data: QueryResultJson | null;
    if (result.status >= 200 && result.status < 300) {
      data = result.data;
    } else {
      data = null;
    }

    return {
      statusCode: result.status,
      statusMsg: result.statusText,
      errorMsg: data?.errors,
      data,
    };
  }
}
