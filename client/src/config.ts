// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'c3rxqxqa4i'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map. For example:
  // domain: 'dev-nd9990-p4.us.auth0.com',
  domain: 'dev-y95lb3hx.us.auth0.com', // Auth0 domain
  clientId: 'DUlUm2TVVJcuI6t6x9ZOEPVHtQ32fTIo', // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
