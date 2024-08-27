const HCAPTCHA_ENDPOINT = "https://api.hcaptcha.com/siteverify";

// https://docs.hcaptcha.com/
export async function verifyHCaptcha(
  clientResponse: string,
  remoteIp: string | null
) {
  if (process.env.NODE_ENV !== "production" || !process.env.HCAPTCHA_SECRET) {
    return true;
  }

  const params = new URLSearchParams({
    response: clientResponse,
    secret: process.env.HCAPTCHA_SECRET || "",
    remoteip: remoteIp ?? "",
    sitekey: process.env.HCAPTCHA_SITEKEY || "",
  });

  const response = await fetch(HCAPTCHA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json();
  return data.success as boolean;
}
