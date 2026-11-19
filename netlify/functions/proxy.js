exports.handler = async (event) => {
  const fileId = event.queryStringParameters && event.queryStringParameters.id;
  const directUrl = event.queryStringParameters && event.queryStringParameters.url;
  const fileName = (event.queryStringParameters && event.queryStringParameters.name) || "photo.jpg";

  if (!fileId && !directUrl) {
    return { statusCode: 400, body: "Missing id or url" };
  }

  // Tạo danh sách URL dự phòng cho Google Photos (=d, =s0, =w4000) để không bao giờ bị lỗi 502
  const candidateUrls = [];
  if (fileId) {
    candidateUrls.push(`https://drive.google.com/uc?export=download&id=${fileId}`);
    candidateUrls.push(`https://lh3.googleusercontent.com/d/${fileId}=s0`);
  } else if (directUrl) {
    if (directUrl.includes("googleusercontent.com")) {
      const baseUrl = directUrl.split("=")[0];
      candidateUrls.push(`${baseUrl}=d`);
      candidateUrls.push(`${baseUrl}=s0`);
      candidateUrls.push(`${baseUrl}=w4000`);
    } else {
      candidateUrls.push(directUrl);
    }
  }

  for (const targetUrl of candidateUrls) {
    try {
      const response = await fetch(targetUrl, {
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
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
      // Thử tham số dự phòng tiếp theo
    }
  }

  return {
    statusCode: 502,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ error: "Failed to fetch image from all candidate URLs" })
  };
};
