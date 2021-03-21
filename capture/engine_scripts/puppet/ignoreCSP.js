const fetch = require('node-fetch');
const https = require('https');
const agent = new https.Agent({
  rejectUnauthorized: false
});

module.exports = async function (page, scenario) {
  await page.setRequestInterception(true);
  page.on('request', async request => {
    if (request.url() === scenario.url()) {
      const result = await fetchRequest(page, request);
      await responseWithoutCSPHeaders(result, request);
    } else {
      request.continue();
    }
  });
};

async function fetchRequest(page, request) {
  const cookiesList = await page.cookies(request.url());
  const cookies = cookiesList.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
  const headers = Object.assign(request.headers(), {cookie: cookies});
  const options = {
    headers: headers,
    body: request.postData(),
    method: request.method(),
    follow: 20,
    agent
  };

  return fetch(request.url(), options);
}

async function responseWithoutCSPHeaders(result, request) {
  const body = await result.buffer();
  const headersWithoutCSP = Object.assign({}, result.headers._headers, {'content-security-policy': ''});
  await request.respond({
    body,
    headers: headersWithoutCSP,
    status: result.status
  });
}
