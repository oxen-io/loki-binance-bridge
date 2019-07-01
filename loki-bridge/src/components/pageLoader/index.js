import React, { Component } from 'react';
import { LinearProgress } from '@material-ui/core';

export default class PageLoader extends Component {
  render() {
    return (
      <div style={{ position: 'fixed', left: '0px', right: '0px', top: '0px', zIndex: '999'}}>
        <LinearProgress />
      </div>
    );
  }
}
