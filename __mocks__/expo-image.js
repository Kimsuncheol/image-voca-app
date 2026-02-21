const React = require('react');
const { View } = require('react-native');

const Image = (props) => {
  return React.createElement(View, { ...props, testID: "mock-expo-image" });
};

module.exports = { Image };
