import React, { PureComponent } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';
import { Route, Switch } from 'react-router-dom';
import { Swap, CreateAccount } from '@routes';
import { ErrorSnackbar } from '@components';
import theme from '@theme';

export default class App extends PureComponent {
  state = {
    padding: 0,
    error: null,
    errorOpen: false
  }

  componentDidMount() {
    this.onResize();
    window.addEventListener('resize', this.onResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  onResize = () => {
    const width = window.innerWidth;
    const padding = (width <= 479) ? '0 8px' : '0 7.5em';
    this.setState({ padding });
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
    const { errorOpen, padding } = this.state;

    return (
      <MuiThemeProvider theme={ createMuiTheme(theme) }>
        <CssBaseline />
        <Grid
          style={{ padding }}
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
