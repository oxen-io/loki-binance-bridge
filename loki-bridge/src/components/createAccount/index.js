import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  Grid,
  Typography,
  Paper,
  IconButton,
  SvgIcon
} from '@material-ui/core';
import styles from './styles';

class CreateAccount extends Component {
  render() {
    return <h1>Create Account</h1>;
  }
}

export default withStyles(styles)(CreateAccount);
