import { getLatestEpisodes } from "animeflv-scraper";

export default defineEventHandler(async () => {

  const data = await getLatestEpisodes();

  return {
    success: true,
    data
  };
});
