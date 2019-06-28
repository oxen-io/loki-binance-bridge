import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import Swap from '../swap';
import CreateAccount from '../createAccount';
import ErrorSnackbar from '../errorSnackbar';

export default class Controller extends Component {
  state = {
    error: 'omg',
    errorOpen: true
  }

  showError = (error) => {
    this.setState({ error, errorOpen: true });
  }

  closeError = () => {
    this.setState({ error: null, errorOpen: false });
  }

  render() {
    const { errorOpen } = this.state;

    return (
      <React.Fragment>
        { this.renderRoutes() }
        { errorOpen && this.renderError() }
      </React.Fragment>
    );
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
}
