import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  FormControl,
  Checkbox
} from '@material-ui/core';
import StyledLabel from '../label';
import styles from './styles';

function StyledCheckbox(props) {
  const {
    classes,
    helpertext,
    id,
    label,
    fullWidth,
    checked,
    onChange,
    error,
    disabled
  } = props;

  return (
    <FormControl className={classes.root} variant="outlined" fullWidth={fullWidth} error={error}>
      <Checkbox
        id={ id }
        helpertext={ helpertext }
        checked={ checked }
        onChange={ onChange }
        value={ id }
        disabled={ disabled }
      />
      <StyledLabel label={ label } style={{ margin: 0 }} />
    </FormControl>
  );
}

StyledCheckbox.propTypes = {
  classes: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  helpertext: PropTypes.string,
  id: PropTypes.string,
  defaultValue: PropTypes.string,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
};

export default withStyles(styles)(StyledCheckbox);
