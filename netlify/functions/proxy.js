exports.handler = async (event) => {
  const fileId = event.queryStringParameters && event.queryStringParameters.id;
  const directUrl = event.queryStringParameters && event.queryStringParameters.url;
  const fileName = (event.queryStringParameters && event.queryStringParameters.name) || "photo.jpg";

  if (!fileId && !directUrl) {
    return { statusCode: 400, body: "Missing id or url" };
  }

  const targetUrl = directUrl ? directUrl : `https://drive.google.com/uc?export=download&id=${fileId}`;

  try {
    const response = await fetch(targetUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
      }
    });

    if (!response.ok) {
      throw new Error(`Fetch status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
        "Cache-Control": "public, max-age=31536000"
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true
    };
  } catch (err) {
    return {
      statusCode: 302,
      headers: {
        Location: targetUrl,
        "Access-Control-Allow-Origin": "*"
      }
    };
  }
};
