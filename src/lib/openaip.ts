export const openAipConfig = {
  apiKey: import.meta.env.VITE_OPENAIP_API_KEY as string | undefined,
  tiles: {
    base: "https://api.openaip.net/api/v1/tiles/base/{z}/{x}/{y}.png",
    airspace: "https://api.openaip.net/api/v1/tiles/openaip/{z}/{x}/{y}.png",
  },
  headers(apiKey?: string) {
    return {
      "x-openaip-api-key": apiKey ?? (import.meta.env.VITE_OPENAIP_API_KEY as string | ""),
    };
  },
};
