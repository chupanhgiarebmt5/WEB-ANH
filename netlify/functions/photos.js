exports.handler = async (event) => {
  const shareUrl = event.queryStringParameters && event.queryStringParameters.url;
  if (!shareUrl) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Thiếu đường dẫn Google Photos" })
    };
  }

  try {
    const response = await fetch(shareUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error("Không truy cập được link Google Photos (" + response.status + ")");
    }

    const html = await response.text();
    const regex = /https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_-]+/g;
    const matches = html.match(regex) || [];
    const uniqueUrls = Array.from(new Set(matches));

    if (uniqueUrls.length === 0) {
      throw new Error("Không tìm thấy ảnh nào. Hãy kiểm tra lại quyền chia sẻ công khai của album.");
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        photos: uniqueUrls.map((baseUrl) => ({ baseUrl }))
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
