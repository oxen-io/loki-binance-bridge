import React, { PureComponent } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';
import { Route, Switch } from 'react-router-dom';
import { Swap, CreateAccount } from './pages';
import { ErrorSnackbar } from './components';
import theme from './theme';

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
      <MuiThemeProvider theme={ createMuiTheme(theme) }>
        <CssBaseline />
        <Grid
          style={{ padding: '0 7.5em'}}
          container
          justify="center"
          alignItems="center"
        >
          <Grid item>
            { this.renderRoutes() }
            { errorOpen && this.renderError() }
          </Grid>
        </Grid>
      </MuiThemeProvider>
    );
  }
}
