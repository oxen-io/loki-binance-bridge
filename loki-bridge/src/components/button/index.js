import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  Button
} from '@material-ui/core';
import styles from './styles';

function StyledButton(props) {
  const {
    classes,
    label,
    fullWidth,
    onClick,
    disabled,
    secondary
  } = props;

  return (
    <Button
      className={[classes.root, secondary && classes.secondary].join(' ')}
      fullWidth={ fullWidth }
      variant="outlined"
      color={ secondary ? 'secondary' : 'primary'}
      disabled={ disabled }
      onClick={ onClick }>
      {label}
    </Button>
  );
}

StyledButton.propTypes = {
  classes: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  secondary: PropTypes.bool,
};

export default withStyles(styles)(StyledButton);
