
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';


const _loaded = {};

export default class ImageLoader extends Component {

  //initial state: image loaded stage
  state = {
    loaded: _loaded[this.props.src]
  };

  //define our loading and loaded image classes
  static defaultProps = {
    className: '',
    loadingClassName: 'img-loading',
    loadedClassName: 'img-loaded'
  };

  //image onLoad handler to update state to loaded
  onLoad = () => {
    _loaded[this.props.src] = true;
    this.setState(() => ({ loaded: true }));
  };


  render() {

    const { loaded } = this.state;
    const { className, loadedClassName, loadingClassName, src, alt, ...props } = this.props;

    return (
      <img
        src={src}
        alt={alt}
        className={clsx(className, loaded ? loadedClassName : loadingClassName)}
        onLoad={this.onLoad}
        {...props}
      />
    );
  }
}

ImageLoader.propTypes = {
  className: PropTypes.string,
  loadingClassName: PropTypes.string,
  loadedClassName: PropTypes.string,
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
};
