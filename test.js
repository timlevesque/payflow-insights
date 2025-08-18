const { URLSearchParams } = require('url');
const fetch = require('node-fetch');
const encodedParams = new URLSearchParams();

encodedParams.set('script', 'function main() {   return Events({     from_date: "2024-01-04",     to_date: "2024-08-07",    event_selectors: [         {event: 'Form Submitted'}]   })}');

const url = 'https://mixpanel.com/api/query/jql?project_id=3251076';
const options = {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'content-type': 'application/x-www-form-urlencoded',
    authorization: 'Basic cGF5Zmxvd2luc2lnaHRzLjgyOWE4My5tcC1zZXJ2aWNlLWFjY291bnQ6djB4b242TGhabDdxeEJOMDNzQm9KOXJ4bG45bnRsRmc='
  },
  body: encodedParams
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error('error:' + err));