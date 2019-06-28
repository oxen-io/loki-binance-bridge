import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  Typography
} from '@material-ui/core';
import styles from './styles';

function Label(props) {
  const {
    label,
    classes,
    style
  } = props;

  return (
    <Typography variant="h6" gutterBottom className={ classes.inline } style={style}>
      {label}
    </Typography>
  );
}

Label.propTypes = {
  classes: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  style: PropTypes.object
};

Label.defaultProps = {
  style: {}
};

export default withStyles(styles)(Label);
