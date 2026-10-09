export const staticDemo = import.meta.env.VITE_DEMO_ONLY === "true";
let token = "";
export async function api(path, method = "GET", body) {
  let response;
  try {
    response = await fetch("/api/" + path + "/", {
      method,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "X-CSRFToken": token } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw Error(
      "Cannot reach the server. Check your connection and try again.",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw Error(
      "The account server is unavailable. You can still explore the demo.",
    );
  }
  if (!response.ok)
    throw Error(result.error || "The request failed. Please try again.");
  if (result.csrfToken) token = result.csrfToken;
  return result;
}
