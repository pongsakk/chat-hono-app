import { createApp } from "./src/main";

const app = await createApp();

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
};
