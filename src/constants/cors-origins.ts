import { CorsOptions } from "cors";

// TODO: Setup env
export const ALLOWED_ORIGINS = [
  "https://vattsopheak.com",
  "http://127.0.0.1:5500",
  "http://localhost:3000",
];

export const CORS_OPTIONS: CorsOptions = {
  origin: ALLOWED_ORIGINS,
  optionsSuccessStatus: 200,
};
