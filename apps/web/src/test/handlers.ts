import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

import { type ApiErrorCode, ERROR_STATUS, errorBody } from "./fixtures/errors";
import { xInfo } from "./fixtures/info";

export const API_URL = "https://api.nowvi.test";
export const INFO_URL = `${API_URL}/api/info`;
export const ORDERS_URL = `${API_URL}/api/orders`;
export const DOWNLOAD_URL = `${API_URL}/api/download`;

/** An mp4 `ftyp` box: enough bytes to stand in for the video. */
export const VIDEO_BYTES = new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109]);
export const VIDEO_FILE_NAME = "nowvi-x-1793330030.mp4";

export const apiError = (code: ApiErrorCode) => HttpResponse.json(errorBody(code), { status: ERROR_STATUS[code] });

export const videoResponse = () =>
  new HttpResponse(VIDEO_BYTES, {
    headers: {
      "content-type": "video/mp4",
      "content-disposition": `attachment; filename="${VIDEO_FILE_NAME}"`,
    },
  });

export const handlers = [
  http.post(INFO_URL, () => HttpResponse.json(xInfo)),
  http.post(ORDERS_URL, () => apiError("payments_disabled")),
  http.get(DOWNLOAD_URL, videoResponse),
];

export const server = setupServer(...handlers);
