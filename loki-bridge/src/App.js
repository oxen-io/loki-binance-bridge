import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { Container } from '@material-ui/core';
import { Route, Switch } from 'react-router-dom';
import Controller from './components/controller';

// TODO: Move this out
const theme = {};

function App() {
  return (
    // <MuiThemeProvider theme={ createMuiTheme(theme) }>
    <React.Fragment>
      <CssBaseline />
      <Container>
        <Controller />
      </Container>
    </React.Fragment>
  );
}

export default App;
