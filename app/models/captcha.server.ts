const HCAPTCHA_ENDPOINT = "https://api.hcaptcha.com/siteverify";

// https://docs.hcaptcha.com/
export async function verifyHCaptcha(
  clientResponse: string,
  remoteIp: string | null
) {
  const params = new URLSearchParams();
  params.append("response", clientResponse);
  params.append("secret", process.env.HCAPTCHA_SECRET || "");
  params.append("remoteip", remoteIp ?? "");
  params.append("sitekey", process.env.HCAPTCHA_SITEKEY || "");

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
