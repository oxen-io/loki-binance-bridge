import React from 'react';
import PropTypes from 'prop-types';
import clxs from 'clsx';
import { withStyles } from '@material-ui/core/styles';
import { Button, CircularProgress } from '@material-ui/core';
import styles from './styles';

function StyledButton(props) {
  const {
    classes,
    label,
    fullWidth,
    onClick,
    disabled,
    secondary,
    loading
  } = props;

  return (
    <div className={classes.root}>
      <Button
        className={clxs(classes.button, secondary && classes.secondary)}
        fullWidth={ fullWidth }
        variant="outlined"
        color={ secondary ? 'secondary' : 'primary'}
        disabled={disabled || loading}
        onClick={ onClick }>
        {label}
      </Button>
      {loading && <CircularProgress size={24} className={classes.buttonProgress} />}
    </div>

  );
}

StyledButton.propTypes = {
  classes: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  secondary: PropTypes.bool,
};

export default withStyles(styles)(StyledButton);
