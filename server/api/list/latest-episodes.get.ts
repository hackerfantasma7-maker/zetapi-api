import { getLatestEpisodes } from "animeflv-scraper";

export default defineCachedEventHandler(async () => {

  const latest = await getLatestEpisodes();

  return {
    success: true,
    data: latest
  };

}, { maxAge: 300 });
