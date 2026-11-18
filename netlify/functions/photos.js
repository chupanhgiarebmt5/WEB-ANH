exports.handler = async (event) => {
  const shareUrl = event.queryStringParameters && event.queryStringParameters.url;
  if (!shareUrl) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Thiếu đường dẫn Google Photos" })
    };
  }

  try {
    const response = await fetch(shareUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`Không truy cập được link Google Photos (Mã lỗi ${response.status})`);
    }

    const html = await response.text();
    const regex = /https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_-]+/g;
    const matches = html.match(regex) || [];
    const uniqueUrls = [...new Set(matches)];

    if (uniqueUrls.length === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Không tìm thấy ảnh trong link này. Hãy kiểm tra lại quyền chia sẻ album Google Photos." })
      };
    }

    const photos = uniqueUrls.map((baseUrl) => ({ baseUrl }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300"
      },
      body: JSON.stringify({ photos })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
