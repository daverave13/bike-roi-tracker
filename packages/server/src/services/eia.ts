import { getSetting } from "../db.js";

export async function getGasPrice(): Promise<number | null> {
  const apiKey = getSetting("eia_api_key");

  if (!apiKey) {
    console.log("EIA API key not configured");
    return null;
  }

  try {
    const url = new URL("https://api.eia.gov/v2/petroleum/pri/gnd/data/");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("frequency", "weekly");
    url.searchParams.set("data[0]", "value");
    url.searchParams.set("facets[duoarea][]", "SCA"); // California
    url.searchParams.set("facets[product][]", "EPMR"); // Regular gasoline
    url.searchParams.set("sort[0][column]", "period");
    url.searchParams.set("sort[0][direction]", "desc");
    url.searchParams.set("length", "1");

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.log("EIA API request failed:", response.status);
      return null;
    }

    const data = await response.json();
    const rawPrice = data?.response?.data?.[0]?.value;
    const price =
      typeof rawPrice === "string" ? parseFloat(rawPrice) : rawPrice;

    if (typeof price === "number" && !isNaN(price)) {
      return price;
    }

    console.log("No price data in EIA response");
    return null;
  } catch (error) {
    console.log("EIA API error:", error);
    return null;
  }
}

export function calculateSavings(
  distance: number,
  mpg: number,
  gasPrice: number,
): number {
  const gallonsUsed = distance / mpg;
  return Math.round(gallonsUsed * gasPrice * 100) / 100;
}
