import React, { PureComponent } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { Grid, Typography } from '@material-ui/core';
import { Snackbar, Swap } from '@components';
import theme from '@theme';

export default class App extends PureComponent {
  state = {
    snackbar: {
      message: null,
      variant: 'success',
      open: false,
    }
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

  renderSnackbar = () => {
    const { snackbar } = this.state;
    return <Snackbar message={snackbar.message} open={snackbar.open} onClose={this.closeMessage} variant={snackbar.variant} />;
  }

  render() {
    return (
      <MuiThemeProvider theme={ createMuiTheme(theme) }>
        <CssBaseline />
        <div id="content">
          <Grid
            id="grid"
            container
            justify="center"
            alignItems="center"
          >
            <Grid item xs={12}>
              <Typography variant="h4" className="title">Loki Bridge</Typography>
              <Swap showMessage={this.showMessage} />
              { this.renderSnackbar() }
            </Grid>
          </Grid>
        </div>
      </MuiThemeProvider>
    );
  }
}
