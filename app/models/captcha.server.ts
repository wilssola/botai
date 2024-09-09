const HCAPTCHA_ENDPOINT = "https://api.hcaptcha.com/siteverify";

/**
 * Verifies the hCaptcha response with the hCaptcha API.
 *
 * @param {string} clientResponse - The response token provided by the hCaptcha client-side integration.
 * @param {string | null} remoteIp - The user's IP address (optional).
 * @returns {Promise<boolean>} - Returns true if the verification is successful, otherwise false.
 * @see https://docs.hcaptcha.com/
 */
export async function verifyHCaptcha(
  clientResponse: string,
  remoteIp: string | null
): Promise<boolean> {
  // If not in production or the hCaptcha secret is not set, return true for development purposes
  if (!HCAPTCHA_SETUP) {
    return true;
  }

  // Prepare the parameters for the hCaptcha verification request
  const params = new URLSearchParams({
    response: clientResponse,
    secret: process.env.HCAPTCHA_SECRET || "",
    remoteip: remoteIp ?? "",
    sitekey: process.env.HCAPTCHA_SITEKEY || "",
  });

  // Send the verification request to the hCaptcha API
  const response = await fetch(HCAPTCHA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  // Parse the response from the hCaptcha API
  const data = await response.json();

  // Return the success status from the hCaptcha API response
  return data.success as boolean;
}

const HCAPTCHA_SETUP =
  process.env.NODE_ENV === "production" && process.env.HCAPTCHA_SECRET;
