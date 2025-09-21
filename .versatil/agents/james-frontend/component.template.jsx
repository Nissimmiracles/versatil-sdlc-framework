// James-Frontend Component Template
import React from 'react';
import PropTypes from 'prop-types';
import styles from './Component.module.css';

const Component = ({ children, className, ...props }) => {
  return (
    <div className={`${styles.component} ${className}`} {...props}>
      {children}
    </div>
  );
};

Component.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

Component.defaultProps = {
  className: ''
};

export default Component;
