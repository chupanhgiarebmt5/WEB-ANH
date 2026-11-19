exports.handler = async (event) => {
  const fileId = event.queryStringParameters && event.queryStringParameters.id;
  const directUrl = event.queryStringParameters && event.queryStringParameters.url;
  const fileName = (event.queryStringParameters && event.queryStringParameters.name) || "photo.jpg";

  if (!fileId && !directUrl) {
    return { statusCode: 400, body: "Missing id or url" };
  }

  const candidateUrls = fileId
    ? [
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        `https://lh3.googleusercontent.com/d/${fileId}=s0`
      ]
    : [directUrl];

  for (const targetUrl of candidateUrls) {
    try {
      const response = await fetch(targetUrl, {
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        }
      });

      if (!response.ok) continue;

      const contentType = response.headers.get("content-type") || "image/jpeg";
      if (contentType.includes("text/html")) continue;

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength < 1000) continue;

      const buffer = Buffer.from(arrayBuffer);
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
          "Cache-Control": "public, max-age=31536000"
        },
        body: buffer.toString("base64"),
        isBase64Encoded: true
      };
    } catch (err) {
      // Thử URL dự phòng tiếp theo
    }
  }

  return {
    statusCode: 502,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify({ error: "Fallback to direct download" })
  };
};
