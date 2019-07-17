import React, { PureComponent } from 'react';
import LazyLoad from 'react-lazy-load';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { Grid, Box } from '@material-ui/core';
import { Snackbar, Swap, ImageLoader } from '@components';
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

  renderBackgroundImage = () => {
    return (
      <div id="background">
        <LazyLoad height={'100%'}>
          <ImageLoader className="backgroundImage" loadedClassName="backgroundImageLoaded" src="/images/background.png" alt="Background" />
        </LazyLoad>
      </div>
    );
  }

  renderTitleImage = () => {
    return (
      <Box display="flex" justifyContent="center" className="title">
        <LazyLoad height={'120px'} className="titleContainer">
          <ImageLoader className="titleImage" loadedClassName="titleImageLoaded" src="/images/logo.png" alt="Logo" />
        </LazyLoad>
      </Box>
    );
  }

  render() {
    return (
      <MuiThemeProvider theme={ createMuiTheme(theme) }>
        <CssBaseline />
        {this.renderBackgroundImage()}
        <div id="content">
          {this.renderTitleImage()}
          <Grid
            id="grid"
            container
            justify="center"
            alignItems="center"
          >
            <Grid item xs={12}>
              <Swap showMessage={this.showMessage} />
              { this.renderSnackbar() }
            </Grid>
          </Grid>
        </div>
      </MuiThemeProvider>
    );
  }
}
