# Loki Bridge Front End

This is the front end used for the loki bridge application.

## Pre-requisites
  - Node 11.15.0
    - This can be installed using [nvm](https://github.com/nvm-sh/nvm)

## Installation

If you're using `nvm` then run:
```
nvm use
```

Install all the dependencies:
```
npm install
```

Edit `config/production.js` with your required settings.

### Development

To run the app in development mode, simply run:
```
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Production

The application needs to be built for production.
This can be done by running:
```
npm run build
```

This should build everything and place it in the `build` folder.<br>
All that needs to be done is to deploy the application.

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
