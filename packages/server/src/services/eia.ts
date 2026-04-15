export async function getGasPrice(): Promise<number | null> {
  try {
    // GasBuddy's map endpoint returns county-level gas prices
    const response = await fetch(
      "https://www.gasbuddy.com/gaspricemap/county?lat=37.7749&lng=-122.4194&usa=true",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.log("GasBuddy request failed:", response.status);
      return null;
    }

    const data = await response.json();

    // GasBuddy returns county-level data, find California average
    if (data && Array.isArray(data)) {
      const caCounties = data.filter(
        (d: { state?: string }) => d.state === "CA"
      );
      if (caCounties.length > 0) {
        const avgPrice =
          caCounties.reduce(
            (sum: number, c: { regular?: number }) => sum + (c.regular || 0),
            0
          ) / caCounties.length;
        if (avgPrice > 0) {
          console.log(`GasBuddy CA average: $${avgPrice.toFixed(2)}`);
          return Math.round(avgPrice * 100) / 100;
        }
      }
    }

    return null;
  } catch (error) {
    console.log("GasBuddy fetch error:", error);
    return null;
  }
}

export function calculateSavings(
  distance: number,
  mpg: number,
  gasPrice: number
): number {
  const gallonsUsed = distance / mpg;
  return Math.round(gallonsUsed * gasPrice * 100) / 100;
}
