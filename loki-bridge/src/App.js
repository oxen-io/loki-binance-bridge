import React, { PureComponent } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';
import { Route, Switch } from 'react-router-dom';
import { Swap } from '@routes';
import { Snackbar } from '@components';
import theme from '@theme';

export default class App extends PureComponent {
  state = {
    padding: 0,
    snackbar: {
      message: null,
      variant: 'success',
      open: false,
    }
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
    const padding = (width <= 600) ? '0 8px' : '0 7.5em';
    this.setState({ padding });
  }

  showMessage = (message, variant) => {
    const snackbar = {
      message,
      variant: variant || 'error',
      open: true
    };
    this.setState({ snackbar });
  }

  closeMessage = (event, reason) => {
    if (reason === 'clickaway') return;
    const snackbar = {
      ...this.state.snackbar,
      open: false
    };
    this.setState({ snackbar });
  }

  renderRoutes = () => {
    return (
      <Switch>
        <Route exact path='/' render={(props) => <Swap {...props} showMessage={this.showMessage} />} />
      </Switch>
    );
  }

  renderSnackbar = () => {
    const { snackbar } = this.state;
    return <Snackbar message={snackbar.message} open={snackbar.open} onClose={this.closeMessage} variant={snackbar.variant} />;
  }

  render() {
    const { padding } = this.state;

    return (
      <MuiThemeProvider theme={ createMuiTheme(theme) }>
        <CssBaseline />
        <div id="content">
          <Grid
            style={{ padding }}
            container
            justify="center"
            alignItems="center"
          >
            <Grid item style={{ maxWidth: '100%' }}>
              { this.renderRoutes() }
              { this.renderSnackbar() }
            </Grid>
          </Grid>
        </div>
      </MuiThemeProvider>
    );
  }
}
