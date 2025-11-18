export const openAipConfig = {
  apiKey: import.meta.env.VITE_OPENAIP_API_KEY as string | undefined,
  tiles: {
    base: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    airspace: "https://a.api.tiles.openaip.net/api/data/openaip/{z}/{x}/{y}.png",
  },
  attribution:
    '&copy; OpenStreetMap contributors, data &copy; <a href="https://www.openaip.net">OpenAIP</a>',
};
