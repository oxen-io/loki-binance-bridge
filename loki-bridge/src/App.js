import React, { PureComponent } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { Container } from '@material-ui/core';
import { Route, Switch } from 'react-router-dom';
import Swap from './pages/swap';
import CreateAccount from './pages/createAccount';
import ErrorSnackbar from './components/errorSnackbar';

// TODO: Move this out
const theme = {};

export default class App extends PureComponent {
  state = {
    error: 'omg',
    errorOpen: true
  }

  showError = (error) => {
    this.setState({ error, errorOpen: true });
  }

  closeError = (event, reason) => {
    if (reason === 'clickaway') return;
    this.setState({ error: null, errorOpen: false });
  }

  renderRoutes = () => {
    return (
      <Switch>
        <Route exact path='/' render={(props) => <Swap {...props} showError={this.showError} />} />
        <Route path='/createAccount' render={(props) => <CreateAccount {...props} showError={this.showError} />} />
      </Switch>
    );
  }

  renderError = () => {
    const { error, errorOpen } = this.state;
    return <ErrorSnackbar error={error} open={errorOpen} onClose={this.closeError} />;
  }

  render() {
    const { errorOpen } = this.state;

    return (
      // <MuiThemeProvider theme={ createMuiTheme(theme) }>
      <React.Fragment>
        <CssBaseline />
        <Container>
          { this.renderRoutes() }
          { errorOpen && this.renderError() }
        </Container>
      </React.Fragment>
    );
  }
}
