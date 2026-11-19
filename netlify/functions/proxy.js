exports.handler = async (event) => {
  const fileId = event.queryStringParameters && event.queryStringParameters.id;
  const directUrl = event.queryStringParameters && event.queryStringParameters.url;
  const fileName = (event.queryStringParameters && event.queryStringParameters.name) || "photo.jpg";

  if (!fileId && !directUrl) {
    return { statusCode: 400, body: "Missing id or url" };
  }

  // Chuẩn hóa URL đích: nếu là Google Photos, ép dùng tham số =d để lấy file ảnh gốc
  let targetUrl = directUrl
    ? directUrl
    : `https://drive.google.com/uc?export=download&id=${fileId}`;

  if (targetUrl.includes("googleusercontent.com")) {
    const baseUrl = targetUrl.split("=")[0];
    targetUrl = `${baseUrl}=d`;
  }

  try {
    const response = await fetch(targetUrl, {
      redirect: "follow",
      headers: {
        // Dùng User-Agent chuẩn Desktop để Google Photos trả về luồng binary ảnh thay vì trang xem trước
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": "https://photos.google.com/"
      }
    });

    if (!response.ok) {
      throw new Error(`Fetch status ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (contentType.includes("text/html")) {
      throw new Error("Received HTML instead of image binary");
    }

    const arrayBuffer = await response.arrayBuffer();
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
    // Trả về lỗi HTTP 502 rõ ràng để frontend xử lý fallback tải trực tiếp, tránh 302 gây lỗi CORS trên fetch()
    return {
      statusCode: 502,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: err.message, fallbackUrl: targetUrl })
    };
  }
};
